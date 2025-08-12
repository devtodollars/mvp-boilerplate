'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/utils/supabase/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  AlertTriangle, 
  Trash2, 
  User as UserIcon, 
  Building2, 
  Heart, 
  MapPin, 
  Euro, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Edit,
  Plus,
  ArrowRight,
  Home,
  Loader2,
  Star,
  TrendingUp,
  BarChart3,
  FileUser,
  FileX,
  ChevronRight,
  HomeIcon,
  UserCog
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/components/providers/AuthProvider';

export default function AccountPage() {
  const { toast } = useToast();
  const router = useRouter();
  const { user, isLoading: isLoadingUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Dashboard data
  const [applications, setApplications] = useState<any[]>([]);
  const [ownedListings, setOwnedListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data: profile, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const fetchDashboardData = async (userId: string) => {
    try {
      setIsLoadingDashboard(true);
      const supabase = createClient();
      const api = createApiClient(supabase);

      // Create individual promises with proper error handling
      const applicationsPromise = api.getUserApplications()
        .then(result => result)
        .catch(() => ({ success: false, applications: [] }));
        
      const ownedPromise = fetchOwnedListings(userId);
      
      const likedPromise = api.getUserLikedListings()
        .then(result => result)
        .catch(() => ({ success: false, listings: [] }));

      // Set a timeout for all operations
      const timeoutId = setTimeout(() => {
        console.warn('Dashboard data loading timeout reached');
      }, 10000);

      // Fetch all data in parallel with individual timeouts
      const [applicationsResult, ownedResult, likedResult] = await Promise.allSettled([
        Promise.race([
          applicationsPromise,
          new Promise<{ success: false; applications: [] }>((_, reject) => 
            setTimeout(() => reject({ success: false, applications: [] }), 8000)
          )
        ]).catch(() => ({ success: false, applications: [] })),
        
        Promise.race([
          ownedPromise,
          new Promise<{ success: false; listings: [] }>((_, reject) => 
            setTimeout(() => reject({ success: false, listings: [] }), 8000)
          )
        ]).catch(() => ({ success: false, listings: [] })),
        
        Promise.race([
          likedPromise,
          new Promise<{ success: false; listings: [] }>((_, reject) => 
            setTimeout(() => reject({ success: false, listings: [] }), 8000)
          )
        ]).catch(() => ({ success: false, listings: [] }))
      ]);

      clearTimeout(timeoutId);

      // Handle results with proper type checking
      if (applicationsResult.status === 'fulfilled' && applicationsResult.value?.success) {
        setApplications(applicationsResult.value.applications || []);
      } else {
        setApplications([]);
      }

      if (ownedResult.status === 'fulfilled' && ownedResult.value?.success) {
        setOwnedListings(ownedResult.value.listings || []);
      } else {
        setOwnedListings([]);
      }

      if (likedResult.status === 'fulfilled' && likedResult.value?.success) {
        setLikedListings(likedResult.value.listings || []);
      } else {
        setLikedListings([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty arrays as fallback
      setApplications([]);
      setOwnedListings([]);
      setLikedListings([]);
    } finally {
      setIsLoadingDashboard(false);
    }
  };

  const fetchOwnedListings = async (userId: string) => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, listings: data || [] };
    } catch (error) {
      console.error('Error fetching owned listings:', error);
      return { success: false, listings: [] };
    }
  };
  
  useEffect(() => {
    if (!user) return;

    // Initial data fetch
    fetchUserProfile(user.id).then(setUserProfile);
    fetchDashboardData(user.id);

    // Set up real-time subscription for new listings
    const supabase = createClient();
    const channel = supabase
      .channel('realtime-listings')
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'listings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('New listing created:', payload.new);
          // Re-fetch owned listings to update the count
          fetchOwnedListings(user.id).then(result => {
            if (result.success) {
              setOwnedListings(result.listings);
            }
          });
        }
      )
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Memoize API client to prevent unnecessary re-creation
  const api = useMemo(() => {
    const supabase = createClient();
    return createApiClient(supabase);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await api.signOut();
      toast({
        title: 'Signed out successfully!'
      });
      router.push('/');
      router.refresh();
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: 'Error signing out',
        description: 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    // Validate email confirmation
    if (deleteEmail !== user.email) {
      toast({
        title: 'Email mismatch',
        description: 'Please enter your email address correctly to confirm account deletion.',
        variant: 'destructive',
      });
      return;
    }

    setDeleteLoading(true);
    try {
      // Call the server-side delete API
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        if (responseData.activeListings) {
          // Show specific message about active listings
          toast({
            title: 'Cannot Delete Account',
            description: `You have ${responseData.activeListings.length} active listing(s). Please deactivate or delete them first from your dashboard.`,
            variant: 'destructive',
          });
          setDeleteLoading(false);
          return;
        } else {
          throw new Error(responseData.error || 'Failed to delete account');
        }
      }

      // Show appropriate message based on response
      if (responseData.warning) {
        toast({
          title: 'Profile Deleted',
          description: responseData.message,
          variant: 'default',
        });
      } else {
        toast({
          title: 'Account deleted successfully',
          description: 'Your account and all associated data have been permanently removed.',
        });
      }
      
      // Reset loading state and close dialog before redirect
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setDeleteEmail('');
      
      // Sign out the user and redirect
      await api.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error deleting account',
        description: error instanceof Error ? error.message : 'There was an error deleting your account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-3 w-3 text-amber-500" />;
      case 'accepted':
        return <CheckCircle className="h-3 w-3 text-emerald-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'withdrawn':
        return <XCircle className="h-3 w-3 text-gray-500" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Under Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Not Selected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'withdrawn':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getMediaUrls = (listing: any) => {
    const media: Array<{ url: string; type: "image" | "video" }> = []

    if (listing.images && Array.isArray(listing.images)) {
      listing.images.forEach((img: string) => {
        media.push({ url: img, type: "image" })
      })
    }

    if (listing.videos && Array.isArray(listing.videos)) {
      listing.videos.forEach((video: string) => {
        media.push({ url: video, type: "video" })
      })
    }

    return media
  };

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(app => app.status === 'pending').length,
      accepted: applications.filter(app => app.status === 'accepted').length,
      rejected: applications.filter(app => app.status === 'rejected').length,
      withdrawn: applications.filter(app => app.status === 'withdrawn').length,
    };
    return stats;
  };

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Your Account</h3>
              <p className="text-gray-600">Setting up your dashboard...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <UserIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Sign In Required</h3>
              <p className="text-gray-600 mb-6">You need to be signed in to view your account dashboard.</p>
              <Button onClick={() => router.push('/auth/signin')} size="lg">
                Sign In to Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-3 sm:p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl items-start gap-4 sm:gap-6 lg:grid-cols-[260px_1fr] xl:grid-cols-[280px_1fr]">
          {/* Navigation Sidebar - Hidden on mobile, sticky on desktop */}
          <nav className="hidden lg:grid gap-2 text-sm lg:sticky lg:top-[6.5rem]">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
              <CardContent className="p-3 sm:p-4">
                <div className="space-y-1">
                  <button
                    onClick={() => scrollToSection('general')}
                    className={`flex items-center space-x-3 w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      activeSection === 'general' 
                        ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-l-4 border-primary' 
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <UserCog className="h-4 w-4" />
                    <span className="font-medium">General</span>
                  </button>
                  <button
                    onClick={() => scrollToSection('profile')}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                      activeSection === 'profile'
                        ? 'bg-blue-600 text-white font-semibold shadow-md'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    <UserIcon className="h-4 w-4" />
                    Profile
                  </button>
                  <div className="border-t pt-2 mt-2">
                    <button
                      onClick={() => scrollToSection('signout')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        activeSection === 'signout'
                          ? 'bg-blue-600 text-white font-semibold shadow-md'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <ArrowRight className="h-4 w-4" />
                      Sign Out
                    </button>
                    <button
                      onClick={() => scrollToSection('delete')}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                        activeSection === 'delete'
                          ? 'bg-red-600 text-white font-semibold shadow-md'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </nav>

          {/* Main Content - Full width on mobile */}
          <div className="grid gap-4 sm:gap-6 lg:gap-8">
            {/* Mobile Header - Only visible on mobile */}
            <div className="grid gap-2 lg:hidden">
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    Account Dashboard
                </h1>
                <p className="text-sm sm:text-base text-gray-600">Manage your account and property activity</p>
            </div>
            
            {/* Desktop Header - Hidden on mobile */}
            <div className="hidden lg:grid gap-2">
                <h1 className="text-4xl font-bold bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                    Account Dashboard
                </h1>
                <p className="text-gray-600">Manage your account settings and view your property activity</p>
            </div>
            
            {/* Welcome Card */}
            <Card id="general" className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-gray-50/50">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Welcome {userProfile?.full_name || userProfile?.first_name || user?.email?.split('@')[0] || 'User'} 👋
                </CardTitle>
                <CardDescription>
                  Manage your account settings, profile, and preferences all in one place.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Account Status: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overview Section */}
            <Card id="overview" className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                    Property Activity Overview
                    </CardTitle>
                    <CardDescription>
                    Your recent activity and property management at a glance
                    </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingDashboard ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
                      <p className="text-gray-600">Loading your activity...</p>
                    </div>
                  </div>
                ) : (
                  <>
                                          {/* Quick Stats - Light Gradients */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-blue-700 text-xs sm:text-sm font-medium">Applications</p>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-900">{applications.length}</p>
                                <p className="text-blue-600 text-xs">
                                  {applications.filter(a => a.status === 'pending').length} pending
                                </p>
                              </div>
                              <div className="bg-blue-500/10 p-2.5 sm:p-3 rounded-full">
                                <FileUser className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-purple-700 text-xs sm:text-sm font-medium">My Listings</p>
                                <p className="text-2xl sm:text-3xl font-bold text-purple-900">{ownedListings.length}</p>
                                <p className="text-purple-600 text-xs">
                                  {ownedListings.filter(l => l.active).length} active
                                </p>
                              </div>
                              <div className="bg-purple-500/10 p-2.5 sm:p-3 rounded-full">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-red-50 to-pink-100 border border-red-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] sm:col-span-2 lg:col-span-1">
                          <CardContent className="p-5 sm:p-6">
                            <div className="flex items-center justify-between">
                              <div className="space-y-1">
                                <p className="text-red-700 text-xs sm:text-sm font-medium">Favorites</p>
                                <p className="text-2xl sm:text-3xl font-bold text-red-900">{likedListings.length}</p>
                                <p className="text-red-600 text-xs">Saved properties</p>
                              </div>
                              <div className="bg-red-500/10 p-2.5 sm:p-3 rounded-full">
                                <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

            
                  </>
                )}
              </CardContent>
                             <CardFooter className="border-t px-6 py-4">
               <Button onClick={() => router.push('/dashboard')}>
                     <TrendingUp className="h-4 w-4 mr-2" />
                     View Full Dashboard
                 </Button>
               </CardFooter>
            </Card>
            
            {/* Profile Section */}
            <Card id="profile" className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-green-50/30">
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Manage your account settings and preferences
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={() => router.push('/account/profile')} disabled={loading}>
                  Edit Profile
                </Button>
              </CardFooter>
            </Card>

            {/* Sign Out Section */}
            <Card id="signout" className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-orange-50/30">
              <CardHeader>
                <CardTitle>Sign out</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSignOut} disabled={loading}>
                  Sign out
                </Button>
              </CardFooter>
            </Card>

            {/* Delete Account Section */}
            <Card id="delete" className="shadow-lg hover:shadow-xl transition-all duration-300 border-red-200 bg-gradient-to-br from-red-50 to-red-100/50">
              <CardHeader>
                <CardTitle className="text-red-700 flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  Delete Account
                </CardTitle>
                <CardDescription className="text-red-600">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t border-red-200 px-6 py-4">
                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" disabled={loading}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-red-700">
                        <AlertTriangle className="h-5 w-5" />
                        Delete Account
                      </DialogTitle>
                      <DialogDescription className="text-red-600">
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="delete-email" className="text-sm font-medium">
                          Confirm your email address
                        </Label>
                        <Input
                          id="delete-email"
                          type="email"
                          placeholder="Enter your email address"
                          value={deleteEmail}
                          onChange={(e) => setDeleteEmail(e.target.value)}
                          className="border-red-300 focus:border-red-500"
                        />
                        <p className="text-xs text-muted-foreground">
                          Type <span className="font-mono font-medium">{user?.email}</span> to confirm
                        </p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-700">
                          <strong>Warning:</strong> This will permanently delete:
                        </p>
                        <ul className="text-sm text-red-600 mt-2 space-y-1">
                          <li>• Your user profile and preferences</li>
                          <li>• All your listings and applications</li>
                          <li>• Your account credentials</li>
                          <li>• All associated data</li>
                        </ul>
                      </div>
                    </div>
                    <DialogFooter className="gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDeleteDialogOpen(false);
                          setDeleteEmail('');
                        }}
                        disabled={deleteLoading}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading || deleteEmail !== user?.email}
                      >
                        {deleteLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Account
                          </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
