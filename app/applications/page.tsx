'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { createApiClient } from '@/utils/supabase/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  User, 
  MapPin, 
  Euro, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft,
  Users,
  Trash2,
  AlertTriangle,
  Heart,
  Home,
  Building2,
  ChevronRight,
  ChevronDown,
  Eye,
  Edit,
  MoreHorizontal,
  Plus,
  Filter,
  Search,
  BarChart3,
  TrendingUp,
  Star,
  Award,
  Zap,
  Target,
  CheckSquare,
  Clock3,
  AlertCircle
} from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { getListingImages } from '@/utils/supabase/storage';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [ownedListings, setOwnedListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [withdrawingApplicationId, setWithdrawingApplicationId] = useState<string | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('overview');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        console.log('Starting to fetch dashboard data...');
        const supabase = createClient();
        const api = createApiClient(supabase);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.log('No user found, redirecting to signin');
          const currentUrl = window.location.pathname + window.location.search;
          router.push(`/auth/signin?redirect=${encodeURIComponent(currentUrl)}`);
          return;
        }
        console.log('User found:', user.id);
        setUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        setUserProfile(profile);
        
        // Debug: Check if user has liked listings
        console.log('User profile liked_listings:', profile?.liked_listings);
        console.log('User profile liked_listings type:', typeof profile?.liked_listings);
        console.log('User profile liked_listings length:', profile?.liked_listings?.length);

        // Fetch all data in parallel with individual error handling
        const [applicationsResult, ownedResult, likedResult] = await Promise.allSettled([
          api.getUserApplications().catch(error => {
            console.error('Error fetching applications:', error);
            return { success: false, applications: [] };
          }),
          fetchOwnedListings(supabase, user.id),
          api.getUserLikedListings().catch(error => {
            console.error('Error fetching liked listings:', error);
            return { success: false, listings: [] };
          })
        ]);

        // Handle applications result
        if (applicationsResult.status === 'fulfilled' && applicationsResult.value.success) {
          setApplications(applicationsResult.value.applications);
        } else {
          console.error('Applications fetch failed:', applicationsResult);
          setApplications([]);
        }

        // Handle owned listings result
        if (ownedResult.status === 'fulfilled' && ownedResult.value.success) {
          setOwnedListings(ownedResult.value.listings);
        } else {
          console.error('Owned listings fetch failed:', ownedResult);
          setOwnedListings([]);
        }

        // Handle liked listings result
        console.log('Liked result status:', likedResult.status);
        
        if (likedResult.status === 'fulfilled') {
          console.log('Liked result value:', likedResult.value);
          if (likedResult.value.success) {
            console.log('Liked listings loaded successfully:', likedResult.value.listings);
            console.log('Number of liked listings:', likedResult.value.listings.length);
            console.log('Setting likedListings state to:', likedResult.value.listings);
            setLikedListings(likedResult.value.listings);
          } else {
            console.error('Liked listings API returned success: false');
            setLikedListings([]);
          }
        } else {
          console.error('Liked listings fetch failed:', likedResult.reason);
          setLikedListings([]);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load your dashboard data.',
          variant: 'destructive',
        });
      } finally {
        console.log('Setting loading to false');
        setLoading(false);
      }
    };

    const fetchOwnedListings = async (supabase: any, userId: string) => {
      try {
        const { data, error } = await supabase
          .from('listings')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, listings: data || [] };
      } catch (error) {
        console.error('Error fetching owned listings:', error);
        return { success: false, listings: [] };
      }
    };

    fetchAllData();
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Timeout reached, forcing loading to false');
      setLoading(false);
    }, 10000);

    return () => clearTimeout(timeoutId);
  }, [router, toast]);

  const handleWithdrawApplication = async (applicationId: string) => {
    setWithdrawingApplicationId(applicationId);
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);
      
      await api.withdrawApplication(applicationId);

      // Update local state
      setApplications(prev => 
        prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: 'withdrawn' }
            : app
        )
      );

      toast({
        title: 'Application Withdrawn',
        description: 'Your application has been withdrawn successfully.',
        variant: 'default',
      });
      
      // Close dialog
      setShowWithdrawDialog(false);
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error withdrawing application:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to withdraw application.',
        variant: 'destructive',
      });
    } finally {
      setWithdrawingApplicationId(null);
    }
  };

  const openWithdrawDialog = (application: any) => {
    setSelectedApplication(application);
    setShowWithdrawDialog(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'withdrawn':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      case 'withdrawn':
        return 'Withdrawn';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const toggleExpandedSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
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

  // Debug: Log likedListings state
  console.log('Current likedListings state:', likedListings);
  console.log('Current likedListings length:', likedListings.length);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      <div className="container mx-auto px-4 py-8">
        {/* Premium Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2 hover:bg-white/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">
                Property Dashboard
              </h1>
              <p className="text-slate-600 mt-1">
                Manage your applications, listings, and favorites
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">
              <Star className="h-3 w-3 mr-1" />
              Premium User
            </Badge>
          </div>
        </div>

        {/* User Profile Preview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <User className="h-5 w-5 text-blue-600" />
                Your Profile
              </CardTitle>
              <CardDescription>
                Account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {userProfile?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {userProfile?.full_name || userProfile?.first_name || user?.email?.split('@')[0] || 'User'}
                    </h3>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">Account Status: Active</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-gray-600">Member since: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Recently'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full" onClick={() => router.push('/account')}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </CardFooter>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Activity Summary
              </CardTitle>
              <CardDescription>
                Your property activity overview
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{getApplicationStats().total}</div>
                    <div className="text-xs text-blue-600">Applications</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{ownedListings.length}</div>
                    <div className="text-xs text-purple-600">Listings</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Pending Reviews</span>
                    <span className="font-semibold text-yellow-600">{getApplicationStats().pending}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Accepted</span>
                    <span className="font-semibold text-green-600">{getApplicationStats().accepted}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Favorites</span>
                    <span className="font-semibold text-red-600">{likedListings.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full" onClick={() => setActiveTab('overview')}>
                <TrendingUp className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Applications</p>
                  <p className="text-3xl font-bold">{getApplicationStats().total}</p>
                </div>
                <User className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Review</p>
                  <p className="text-3xl font-bold">{getApplicationStats().pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Accepted</p>
                  <p className="text-3xl font-bold">{getApplicationStats().accepted}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">My Listings</p>
                  <p className="text-3xl font-bold">{ownedListings.length}</p>
                </div>
                <Home className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Applications ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="listings" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              My Listings ({ownedListings.length})
            </TabsTrigger>
            <TabsTrigger value="favorites" className="flex items-center gap-2">
              <Heart className="h-4 w-4" />
              Favorites ({likedListings.length})
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            {/* Applications Carousel */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-5 w-5 text-blue-600" />
                      Recent Applications
                    </CardTitle>
                    <CardDescription>
                      Your latest property applications and their status
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpandedSection('applications')}
                    className="flex items-center gap-2"
                  >
                    {expandedSections.has('applications') ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        View All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                    <p className="text-gray-500 mb-4">Start applying to properties to see them here</p>
                    <Button onClick={() => router.push('/search')}>
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent className="-ml-2 md:-ml-4">
                          {applications.slice(0, 6).map((application) => (
                            <CarouselItem key={application.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 h-full">
                                <CardContent className="p-4 h-full flex flex-col">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-sm line-clamp-1 text-gray-900">
                                        {application.listing.property_name}
                                      </h4>
                                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{application.listing.city}</span>
                                      </p>
                                    </div>
                                    <Badge className={`text-xs ml-2 flex-shrink-0 ${getStatusColor(application.status)}`}>
                                      {getStatusText(application.status)}
                                    </Badge>
                                  </div>
                                  <div className="space-y-2 flex-1">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">Rent:</span>
                                      <span className="font-medium text-gray-900">€{application.listing.monthly_rent}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-gray-500">Applied:</span>
                                      <span className="text-gray-900">{new Date(application.applied_at).toLocaleDateString()}</span>
                                    </div>
                                    {application.status === 'pending' && (
                                      <div className="flex items-center justify-between text-xs">
                                        <span className="text-gray-500">Position:</span>
                                        <span className="font-medium text-blue-600">#{application.position}</span>
                                      </div>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            </CarouselItem>
                          ))}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                        <CarouselNext className="right-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                      </Carousel>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Owned Listings Carousel */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      My Listings
                    </CardTitle>
                    <CardDescription>
                      Properties you own and manage
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpandedSection('listings')}
                    className="flex items-center gap-2"
                  >
                    {expandedSections.has('listings') ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        View All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ownedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
                    <p className="text-gray-500 mb-4">Start listing your properties to see them here</p>
                    <Button onClick={() => router.push('/listroom')}>
                      List a Property
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent className="-ml-2 md:-ml-4">
                          {ownedListings.slice(0, 6).map((listing) => {
                            const mediaUrls = getMediaUrls(listing);
                            const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                            
                            return (
                              <CarouselItem key={listing.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                                  <div className="relative h-40">
                                    {firstImage ? (
                                      <Image
                                        src={firstImage}
                                        alt={listing.property_name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <Building2 className="h-10 w-10 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                      <Badge className="bg-white/95 text-gray-800 font-semibold shadow-lg">
                                        €{listing.monthly_rent}
                                      </Badge>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                      <Badge variant="outline" className="bg-white/95 text-gray-700 text-xs">
                                        {listing.room_type}
                                      </Badge>
                                    </div>
                                  </div>
                                  <CardContent className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900">
                                      {listing.property_name}
                                    </h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{listing.city}</span>
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <span>Active</span>
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      </div>
                                      <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                                        <Edit className="h-3 w-3 mr-1" />
                                        Edit
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                        <CarouselNext className="right-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                      </Carousel>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Liked Listings Carousel */}
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Heart className="h-5 w-5 text-red-600" />
                      Favorite Properties
                    </CardTitle>
                    <CardDescription>
                      Properties you've saved for later
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpandedSection('favorites')}
                    className="flex items-center gap-2"
                  >
                    {expandedSections.has('favorites') ? (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Collapse
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4" />
                        View All
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {likedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                    <p className="text-gray-500 mb-4">Start liking properties to see them here</p>
                    <Button onClick={() => router.push('/search')}>
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Carousel className="w-full">
                        <CarouselContent className="-ml-2 md:-ml-4">
                          {likedListings.slice(0, 6).map((listing) => {
                            const mediaUrls = getMediaUrls(listing);
                            const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                            
                            return (
                              <CarouselItem key={listing.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                                <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden h-full">
                                  <div className="relative h-40">
                                    {firstImage ? (
                                      <Image
                                        src={firstImage}
                                        alt={listing.property_name}
                                        fill
                                        className="object-cover"
                                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <Home className="h-10 w-10 text-gray-400" />
                                      </div>
                                    )}
                                    <div className="absolute top-3 right-3">
                                      <Badge className="bg-white/95 text-gray-800 font-semibold shadow-lg">
                                        €{listing.monthly_rent}
                                      </Badge>
                                    </div>
                                    <div className="absolute top-3 left-3">
                                      <Heart className="h-6 w-6 text-red-500 fill-current drop-shadow-lg" />
                                    </div>
                                    <div className="absolute bottom-3 left-3">
                                      <Badge variant="outline" className="bg-white/95 text-gray-700 text-xs">
                                        {listing.room_type}
                                      </Badge>
                                    </div>
                                  </div>
                                  <CardContent className="p-4 flex-1 flex flex-col">
                                    <h4 className="font-semibold text-sm line-clamp-2 mb-2 text-gray-900">
                                      {listing.property_name}
                                    </h4>
                                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-3">
                                      <MapPin className="h-3 w-3 flex-shrink-0" />
                                      <span className="truncate">{listing.city}</span>
                                    </p>
                                    <div className="mt-auto flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs">
                                        <span className="text-gray-600">Favorited</span>
                                        <Heart className="h-3 w-3 text-red-500 fill-current" />
                                        {!listing.active && (
                                          <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                            Inactive
                                          </Badge>
                                        )}
                                      </div>
                                      <Button size="sm" variant="outline" className="h-7 px-3 text-xs">
                                        <Eye className="h-3 w-3 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              </CarouselItem>
                            );
                          })}
                        </CarouselContent>
                        <CarouselPrevious className="left-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                        <CarouselNext className="right-4 h-10 w-10 bg-white/95 border-0 shadow-xl hover:bg-white hover:scale-105 transition-transform" />
                      </Carousel>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <User className="h-5 w-5 text-blue-600" />
                  All Applications
                </CardTitle>
                <CardDescription>
                  Complete list of your property applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                    <p className="text-gray-500 mb-4">Start applying to properties to see them here</p>
                    <Button onClick={() => router.push('/search')}>
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <Card key={application.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-lg">
                                  {application.listing.property_name}
                                </h4>
                                <Badge className={getStatusColor(application.status)}>
                                  {getStatusIcon(application.status)}
                                  <span className="ml-1">{getStatusText(application.status)}</span>
                                </Badge>
                              </div>
                              <p className="text-gray-600 flex items-center gap-2 mb-3">
                                <MapPin className="h-4 w-4" />
                                {application.listing.address}, {application.listing.city}
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-2">
                                  <Euro className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">
                                    €{application.listing.monthly_rent} per {application.listing.rent_frequency || 'month'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">
                                    Applied {new Date(application.applied_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {application.status === 'pending' && (
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-gray-500" />
                                    <span className="text-sm">
                                      Position #{application.position} in queue
                                    </span>
                                  </div>
                                )}
                              </div>
                              {application.notes && (
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mt-4">
                                  <p className="text-sm text-gray-700">
                                    <strong>Your notes:</strong> {application.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                            {application.listing.images && application.listing.images.length > 0 && (
                              <div className="relative w-24 h-20 rounded-lg overflow-hidden flex-shrink-0 ml-4">
                                <Image
                                  src={application.listing.images[0]}
                                  alt={application.listing.property_name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            {application.status === 'pending' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openWithdrawDialog(application)}
                                className="flex items-center gap-2"
                                disabled={withdrawingApplicationId === application.id}
                              >
                                {withdrawingApplicationId === application.id ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                                    Withdrawing...
                                  </>
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4" />
                                    Withdraw Application
                                  </>
                                )}
                              </Button>
                            )}
                            {(application.status === 'withdrawn' || application.status === 'rejected') && (
                              <Button
                                size="sm"
                                onClick={() => router.push(`/search?property=${application.listing.id}`)}
                                className="flex items-center gap-2"
                              >
                                <User className="h-4 w-4" />
                                {application.status === 'withdrawn' ? 'Apply Again' : 'Apply to Property'}
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5 text-purple-600" />
                      My Listings
                    </CardTitle>
                    <CardDescription>
                      Properties you own and manage
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/listroom')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add Listing
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ownedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Listings Yet</h3>
                    <p className="text-gray-500 mb-4">Start listing your properties to see them here</p>
                    <Button onClick={() => router.push('/listroom')}>
                      List a Property
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedListings.map((listing) => {
                      const mediaUrls = getMediaUrls(listing);
                      const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                      
                      return (
                        <Card key={listing.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="relative h-48">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={listing.property_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Building2 className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-white/90 text-gray-800 font-semibold">
                                €{listing.monthly_rent}
                              </Badge>
                            </div>
                            <div className="absolute top-3 left-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/90">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-lg mb-2 line-clamp-1">
                              {listing.property_name}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4" />
                              {listing.city}, {listing.county}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">
                                {listing.room_type}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Edit
                                </Button>
                                <Button size="sm">
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Heart className="h-5 w-5 text-red-600" />
                  Favorite Properties
                </CardTitle>
                <CardDescription>
                  Properties you've saved for later
                </CardDescription>
              </CardHeader>
              <CardContent>
                {likedListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Favorites Yet</h3>
                    <p className="text-gray-500 mb-4">Start liking properties to see them here</p>
                    <Button onClick={() => router.push('/search')}>
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedListings.map((listing) => {
                      const mediaUrls = getMediaUrls(listing);
                      const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                      
                      return (
                        <Card key={listing.id} className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="relative h-48">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={listing.property_name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <Home className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute top-3 right-3">
                              <Badge className="bg-white/90 text-gray-800 font-semibold">
                                €{listing.monthly_rent}
                              </Badge>
                            </div>
                            <div className="absolute top-3 left-3">
                              <Heart className="h-6 w-6 text-red-500 fill-current" />
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-lg mb-2 line-clamp-1">
                              {listing.property_name}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4" />
                              {listing.city}, {listing.county}
                            </p>
                                                              <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline">
                                        {listing.room_type}
                                      </Badge>
                                      {!listing.active && (
                                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                          Inactive
                                        </Badge>
                                      )}
                                    </div>
                                    <Button size="sm" onClick={() => router.push(`/search?property=${listing.id}`)}>
                                      <Eye className="h-3 w-3 mr-1" />
                                      View Details
                                    </Button>
                                  </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Withdraw Confirmation Dialog */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="text-lg font-semibold text-red-600">Withdraw Application</h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                Are you sure you want to withdraw your application for <strong>{selectedApplication.listing.property_name}</strong>?
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <h4 className="font-medium text-red-800 mb-2">What happens when you withdraw:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Your application will be removed from the queue</li>
                  <li>• You'll lose your position in line</li>
                  <li>• You can apply again, but you'll be at the end of the queue</li>
                  <li>• This action cannot be undone</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawDialog(false);
                    setSelectedApplication(null);
                  }}
                  disabled={withdrawingApplicationId === selectedApplication.id}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleWithdrawApplication(selectedApplication.id)}
                  disabled={withdrawingApplicationId === selectedApplication.id}
                  className="flex-1 flex items-center gap-2"
                >
                  {withdrawingApplicationId === selectedApplication.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-4 w-4" />
                      Yes, Withdraw
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 