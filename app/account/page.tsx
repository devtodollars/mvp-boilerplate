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
import { User } from '@supabase/supabase-js';
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
import { AlertTriangle, Trash2 } from 'lucide-react';

export default function AccountPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('general');

  // Create Supabase client once and memoize it
  const supabase = useMemo(() => createClient(), []);

  const fetchUserProfile = async (userId: string) => {
    try {
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

  useEffect(() => {
    // Get initial user state
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          router.push('/auth/signin');
          return;
        }
        setUser(user);
        
        // Fetch user profile if user exists
        if (user) {
          const profile = await fetchUserProfile(user.id);
          setUserProfile(profile);
        }
      } catch (error) {
        console.error('Error getting user:', error);
        router.push('/auth/signin');
      } finally {
        setIsLoadingUser(false);
      }
    };

    // Set up auth state listener for real-time updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          router.push('/auth/signin');
        } else if (session?.user) {
          setUser(session.user);
          // Fetch user profile
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else if (event === 'TOKEN_REFRESHED' && !session?.user) {
          // Token refreshed but no user, redirect to sign in
          router.push('/auth/signin');
        }
        
        setIsLoadingUser(false);
      }
    );

    // Get initial user
    getUser();
    
    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth, router]);

  // Memoize API client to prevent unnecessary re-creation
  const api = useMemo(() => createApiClient(supabase), [supabase]);

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
        throw new Error(responseData.error || 'Failed to delete account');
      }

      // Sign out the user
      await api.signOut();

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
      
      setDeleteDialogOpen(false);
      setDeleteEmail('');
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

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading account...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground">You need to be signed in to view this page.</p>
              <Button onClick={() => router.push('/auth/signin')} className="mt-4">
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-white">
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Account</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav className="grid gap-4 text-sm">
            <button
              onClick={() => scrollToSection('general')}
              className={`text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'general'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              General
            </button>
            <button
              onClick={() => scrollToSection('email')}
              className={`text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'email'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => scrollToSection('profile')}
              className={`text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'profile'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => scrollToSection('signout')}
              className={`text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'signout'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              Sign Out
            </button>
            <button
              onClick={() => scrollToSection('delete')}
              className={`text-left px-3 py-2 rounded-lg transition-all duration-200 ${
                activeSection === 'delete'
                  ? 'bg-primary text-primary-foreground font-semibold shadow-md'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              }`}
            >
              Delete Account
            </button>
            <Link 
              href="mailto:support@golet.com" 
              className="text-left px-3 py-2 rounded-lg transition-all duration-200 text-muted-foreground hover:text-primary hover:bg-primary/10"
            >
              Support
            </Link>
          </nav>
          <div className="grid gap-6">
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
            
            <Card id="email" className="shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-white to-blue-50/30">
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  The email associated with your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <Input placeholder="Email" value={user.email || ''} disabled />
                </form>
              </CardContent>
            </Card>
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
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
