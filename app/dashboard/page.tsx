'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { createApiClient } from '@/utils/supabase/api';
import { Button } from '@/components/ui/button';
import { trackListingView } from '@/utils/supabase/listings';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  User, 
  MapPin, 
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
  Eye,
  Plus,
  Loader2,
  LayoutGrid,
  FileSearch,
  Search,
  Settings,
  MessageSquare
} from 'lucide-react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DeleteListingDialog } from '@/components/DeleteListingDialog';
import { PaymentStatusCard } from '@/components/PaymentStatusCard';


export default function ApplicationsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [ownedListings, setOwnedListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setUserProfile] = useState<any>(null);
  const [withdrawingApplicationId, setWithdrawingApplicationId] = useState<string | null>(null);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedListingForDelete, setSelectedListingForDelete] = useState<any>(null);
  const router = useRouter();
  const { toast } = useToast();
  
  // Get user from AuthProvider context at the top level
  const { user } = useAuth();

  const fetchAllData = async () => {
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);

      // Check if user is available
      if (!user) {
        // Check if we're returning from a payment (don't redirect in this case)
        if (typeof window !== 'undefined') {
          const searchParams = new URLSearchParams(window.location.search);
          const paymentStatus = searchParams.get('payment');
          
          if (paymentStatus === 'success' || paymentStatus === 'cancelled') {
            console.log('Returning from payment, not redirecting to auth - waiting for user state');
            // Don't return early, just skip the data fetching but don't redirect
            setLoading(false);
            return;
          }
        }
        
        // Only redirect to auth if we're not in a payment flow and payment processing is complete
        if (typeof window !== 'undefined' && paymentProcessingComplete && !isProcessingPayment) {
          const currentUrl = window.location.pathname + window.location.search;
          router.push(`/auth/signin?redirect=${encodeURIComponent(currentUrl)}`);
        }
        return;
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);

      // Fetch all data in parallel
      const [applicationsResult, ownedResult, likedResult] = await Promise.allSettled([
        api.getUserApplications(user).catch(error => {
          console.error('Error fetching applications:', error);
          return { success: false, applications: [] };
        }),
        fetchOwnedListings(supabase, user.id),
        api.getUserLikedListings(user).catch(error => {
          console.error('Error fetching liked listings:', error);
          return { success: false, listings: [] };
        })
      ]);

      // Handle results
      console.log('=== HANDLING FETCH RESULTS ===');
      console.log('Applications result:', applicationsResult);
      console.log('Owned listings result:', ownedResult);
      console.log('Liked listings result:', likedResult);

      if (applicationsResult.status === 'fulfilled' && applicationsResult.value.success) {
        console.log('Setting applications:', applicationsResult.value.applications);
        setApplications(applicationsResult.value.applications);
      } else {
        console.log('Applications failed, setting empty array');
        setApplications([]);
      }

      if (ownedResult.status === 'fulfilled' && ownedResult.value.success) {
        console.log('Setting owned listings:', ownedResult.value.listings);
        setOwnedListings(ownedResult.value.listings);
      } else {
        console.log('Owned listings failed, setting empty array');
        setOwnedListings([]);
      }

      if (likedResult.status === 'fulfilled' && likedResult.value.success) {
        console.log('Setting liked listings:', likedResult.value.listings);
        setLikedListings(likedResult.value.listings);
      } else {
        console.log('Liked listings failed, setting empty array');
        setLikedListings([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      
      // Set empty arrays to prevent UI issues
      setApplications([]);
      setOwnedListings([]);
      setLikedListings([]);
      
      // Only show error toast if it's not an auth issue
      if (user) {
        toast({
          title: 'Error',
          description: 'Some dashboard data could not be loaded. Please refresh the page.',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    } else if (user === null) {
      // User is explicitly null (not loading), redirect to auth
      setLoading(false);
    }
  }, [user]);

  // Handle payment success/cancellation from URL params
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    console.log('Dashboard useEffect running, checking URL params...');
    console.log('Current URL:', window.location.href);
    
    const searchParams = new URLSearchParams(window.location.search);
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    const paymentId = searchParams.get('payment_id');
    
    console.log('URL params found:', { paymentStatus, sessionId, paymentId });
    
    if (paymentStatus === 'success' && sessionId && paymentId) {
      console.log('Payment success detected, processing...');
      
      // Set active tab to listings immediately
      setActiveTab('listings');
      
      // Clean up URL params immediately to prevent redirect issues
      const newUrl = '/dashboard?tab=listings';
      console.log('Replacing URL with:', newUrl);
      window.history.replaceState({}, '', newUrl);
      
      // Process payment verification
      processPaymentVerification(sessionId, paymentId);
      
    } else if (paymentStatus === 'cancelled') {
      console.log('Payment cancelled detected');
      
      // Set active tab to listings immediately
      setActiveTab('listings');
      
      // Clean up URL params immediately
      const newUrl = '/dashboard?tab=listings';
      console.log('Replacing URL with:', newUrl);
      window.history.replaceState({}, '', newUrl);
      
      // Mark payment processing as complete
      setPaymentProcessingComplete(true);
      setIsProcessingPayment(false);
      
      toast({
        title: 'Payment Cancelled',
        description: 'Your payment was cancelled. You can try again anytime.',
        variant: 'destructive',
      });
    }
  }, []); // Remove user dependency to avoid re-running

  const processPaymentVerification = async (sessionId: string, paymentId: string) => {
    try {
      console.log('=== PROCESSING PAYMENT VERIFICATION ===');
      console.log('Session ID:', sessionId);
      console.log('Payment ID:', paymentId);
      
      // Show loading state
      setIsProcessingPayment(true);
      
      // Wait a moment for user state to potentially load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Calling payment status check API...');
      // Check payment status with Stripe
      const response = await fetch('/api/stripe/check-payment-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          paymentId
        }),
      });

      console.log('Payment status check response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Payment status check failed:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Payment status result:', result);
      
      if (result.success && result.payment_status === 'paid') {
        console.log('Payment confirmed as successful');
        
        // Show success message
        toast({
          title: 'Payment Successful! 🎉',
          description: 'Your listing is now active for 30 days. Refreshing your listings...',
          variant: 'default',
        });
        
        // Mark payment processing as complete
        setPaymentProcessingComplete(true);
        setIsProcessingPayment(false);
        
        // Simple refresh: force data reload
        console.log('Refreshing page data after successful payment...');
        
        // Wait a moment for database to update
        setTimeout(async () => {
          console.log('Forcing data refresh...');
          await fetchAllData();
          setRefreshTrigger(prev => prev + 1);
        }, 2000);
        
      } else {
        console.log('Payment not successful:', result);
        toast({
          title: 'Payment Issue',
          description: result.message || 'Payment was not completed successfully. Please try again.',
          variant: 'destructive',
        });
        
        // Mark payment processing as complete even if failed
        setPaymentProcessingComplete(true);
        setIsProcessingPayment(false);
      }
      
    } catch (error) {
      console.error('Error processing payment verification:', error);
      toast({
        title: 'Payment Verification Error',
        description: error instanceof Error ? error.message : 'Could not verify payment status. Please refresh the page.',
        variant: 'destructive',
      });
      
      // Mark payment processing as complete even on error
      setPaymentProcessingComplete(true);
      setIsProcessingPayment(false);
    }
  };

  const fetchOwnedListings = async (supabase: any, userId: string) => {
    try {
      console.log('=== FETCHING OWNED LISTINGS ===');
      console.log('User ID:', userId);
      
      // Ensure expired listings are marked before fetching
      try {
        await fetch('/api/listings/check-expired', { method: 'POST' })
      } catch (e) {
        console.warn('Failed to trigger expiry check, proceeding anyway');
      }

      // First, fetch the listings with owner information
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      console.log('Raw listings from database:', listings);
      console.log('Listings error:', listingsError);

      if (listingsError) throw listingsError;

      // Fetch owner information for each listing
      const listingsWithOwners = await Promise.all(
        (listings || []).map(async (listing: any) => {
          if (listing.user_id) {
            const { data: ownerData } = await supabase
              .from('users')
              .select('id, full_name, verified')
              .eq('id', listing.user_id)
              .single();
            
            return {
              ...listing,
              owner: ownerData || null
            };
          }
          return listing;
        })
      );

      // Then, for each listing, get the applicant count using the new function
      const listingsWithApplicants = await Promise.all(
        (listingsWithOwners || []).map(async (listing: any) => {
          try {
            const { data: statsData, error: statsError } = await supabase.rpc('get_listing_stats', {
              listing_uuid: listing.id
            });

            if (statsError) {
              console.error(`Error getting stats for listing ${listing.id}:`, statsError);
              return {
                ...listing,
                applicants: { count: 0 },
                views_count: listing.views_count || 0
              };
            }

            const stats = statsData && statsData.length > 0 ? statsData[0] : null;
            return {
              ...listing,
              applicants: { 
                count: stats?.applicant_count || 0 
              },
              views_count: stats?.views_count || listing.views_count || 0
            };
          } catch (error) {
            console.error(`Error processing listing ${listing.id}:`, error);
            return {
              ...listing,
              applicants: { count: 0 },
              views_count: listing.views_count || 0
            };
          }
        })
      );

      console.log('Final listings with applicants:', listingsWithApplicants);
      console.log('Returning success with', listingsWithApplicants.length, 'listings');
      return { success: true, listings: listingsWithApplicants };
    } catch (error) {
      console.error('Error fetching owned listings:', error);
      console.log('Returning failure with empty array');
      return { success: false, listings: [] };
    }
  };

  const handleWithdrawApplication = async (applicationId: string) => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please sign in to withdraw your application.',
        variant: 'destructive',
      });
      return;
    }

    setWithdrawingApplicationId(applicationId);
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);
      
      console.log('Dashboard: Withdrawing application with user:', user.id); // Debug log
      await api.withdrawApplication(applicationId, user);

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
        return <Clock className="h-4 w-4 text-amber-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />;
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
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'accepted':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'withdrawn':
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
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

  // Check if we're processing a payment (client-side only)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentProcessingComplete, setPaymentProcessingComplete] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const paymentStatus = searchParams.get('payment');
      const isPaymentFlow = paymentStatus === 'success' || paymentStatus === 'cancelled';
      setIsProcessingPayment(isPaymentFlow);
      
      // If no payment params, mark processing as complete
      if (!isPaymentFlow) {
        setPaymentProcessingComplete(true);
      }
    }
  }, []);

  // Refresh data when user becomes available after payment processing
  useEffect(() => {
    if (user && paymentProcessingComplete && isProcessingPayment === false) {
      console.log('User became available after payment processing, refreshing data...');
      fetchAllData();
    }
  }, [user, paymentProcessingComplete, isProcessingPayment]);

  if (loading || isProcessingPayment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center max-w-md">
              <div className="relative mb-6">
                <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto" />
                {isProcessingPayment && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {isProcessingPayment ? 'Processing Your Payment...' : 'Loading Your Dashboard'}
              </h3>
              <p className="text-gray-600 mb-4">
                {isProcessingPayment 
                  ? 'We\'re confirming your payment with Stripe and updating your listing status. This usually takes just a few seconds.'
                  : 'Gathering your applications, listings, and favorites...'
                }
              </p>
              {isProcessingPayment && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                  <div className="flex items-center gap-2 text-blue-800 text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span>Verifying payment with Stripe...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        {/* Header - Mobile Optimized */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex items-start sm:items-center gap-2 sm:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-1 sm:gap-2 hover:bg-white/80 transition-colors -ml-2 sm:-ml-0"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
                Dashboard
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-0.5 sm:mt-1">
                Manage your property portfolio and applications
              </p>
            </div>
          </div>
          {/* Quick Actions + Account Settings */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/search')}
              className="flex items-center gap-2 hover:bg-blue-50 transition-colors"
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/listroom')}
              className="flex items-center gap-2 hover:bg-green-50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">List Property</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/account')}
              className="flex items-center gap-2 hover:bg-white/80 transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Account Settings</span>
            </Button>
          </div>
        </div>

        {/* Stats Cards - Light Gradients */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="space-y-1">
                  <p className="text-blue-700 text-xs sm:text-sm font-medium">Total Applications</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900">{getApplicationStats().total}</p>
                  <p className="text-blue-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Properties applied to</p>
                </div>
                <div className="bg-blue-500/10 p-2 sm:p-2.5 md:p-3 rounded-full self-end sm:self-auto">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="space-y-1">
                  <p className="text-amber-700 text-xs sm:text-sm font-medium">Under Review</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-amber-900">{getApplicationStats().pending}</p>
                  <p className="text-amber-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Awaiting response</p>
                </div>
                <div className="bg-amber-500/10 p-2 sm:p-2.5 md:p-3 rounded-full self-end sm:self-auto">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="space-y-1">
                  <p className="text-emerald-700 text-xs sm:text-sm font-medium">Accepted</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-900">{getApplicationStats().accepted}</p>
                  <p className="text-emerald-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Successful applications</p>
                </div>
                <div className="bg-emerald-500/10 p-2 sm:p-2.5 md:p-3 rounded-full self-end sm:self-auto">
                  <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]">
            <CardContent className="p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                <div className="space-y-1">
                  <p className="text-purple-700 text-xs sm:text-sm font-medium">My Listings</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-900">{ownedListings.length}</p>
                  <p className="text-purple-600 text-[10px] sm:text-xs mt-0.5 sm:mt-1">Properties you own</p>
                </div>
                <div className="bg-purple-500/10 p-2 sm:p-2.5 md:p-3 rounded-full self-end sm:self-auto">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs - Mobile Optimized */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-white/80 backdrop-blur-sm shadow-lg">
            <TabsTrigger 
              value="overview" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
            >
              <LayoutGrid className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden">View</span>
            </TabsTrigger>
            <TabsTrigger 
              value="applications" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
            >
              <FileSearch className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Applications</span>
              <span className="sm:hidden">Apps</span>
            </TabsTrigger>
            <TabsTrigger 
              value="listings" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Listings</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
            <TabsTrigger 
              value="favorites" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-4 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all text-xs sm:text-sm"
            >
              <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Favorites</span>
              <span className="sm:hidden">Faves</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Applications */}
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5 text-blue-600" />
                    Recent Applications
                  </CardTitle>
                  <CardDescription>
                    Your latest property applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {applications.length === 0 ? (
                    <div className="text-center py-12 sm:py-16">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2">No applications yet</h3>
                      <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6 px-4">Start browsing properties to find your perfect home</p>
                      <Button onClick={() => router.push('/search')} variant="outline" className=" text-sm sm:text-base">
                        <Search className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                        Browse Properties
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {applications.slice(0, 3).map((application) => (
                        <div key={application.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200">
                          {/* Property Image */}
                          <div className="relative w-16 h-16 flex-shrink-0 p-1">
                            <div className="relative w-full h-full rounded-lg overflow-hidden">
                              {application.listing?.images && application.listing.images.length > 0 ? (
                                <Image
                                  src={application.listing.images[0]}
                                  alt={application.listing.property_name}
                                  fill
                                  sizes="64px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
                                  <Building2 className="h-6 w-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Property Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-sm text-gray-900 truncate">
                                {application.listing?.property_name || 'Property Name'}
                              </h3>
                              <Badge className={`${getStatusColor(application.status)} shrink-0 text-xs px-2 py-0.5`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1">{getStatusText(application.status)}</span>
                              </Badge>
                            </div>
                            
                            <p className="text-xs text-gray-600 truncate mb-2">
                              {application.listing?.property_address || 'Address not available'}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>{new Date(application.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(application.created_at).toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs px-3 py-1 h-8"
                              onClick={() => router.push(`/search?id=${application.listing?.id}&view=detailed`)}
                            >
                              View
                            </Button>
                            {application.status === 'pending' && (
                              <Button 
                                variant="destructive" 
                                size="sm"
                                className="text-xs px-3 py-1 h-8"
                                onClick={() => openWithdrawDialog(application)}
                              >
                                Withdraw
                              </Button>
                            )}
                            {application.status === 'accepted' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs px-3 py-1 h-8"
                                onClick={() => {
                                  // This will trigger the ChatTabs component to open
                                  // We'll use a custom event to communicate between components
                                  window.dispatchEvent(new CustomEvent('openChat', {
                                    detail: { applicationId: application.id }
                                  }))
                                }}
                              >
                                <MessageSquare className="h-3 w-3 mr-1" />
                                Chat
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                      {applications.length > 3 && (
                        <div className="pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setActiveTab('applications')}
                            className="w-full text-sm"
                          >
                            View All Applications ({applications.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Favorite Properties */}
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
                    <div className="text-center py-16">
                      <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">No Favorites Yet</h3>
                      <p className="text-gray-500 mb-4">Save properties you're interested in</p>
                      <Button onClick={() => router.push('/search')} size="sm">
                        Browse Properties
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {likedListings.slice(0, 3).map((listing) => {
                        const mediaUrls = getMediaUrls(listing);
                        const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                        
                        return (
                          <div key={listing.id} className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200 hover:border-red-300 hover:shadow-md transition-all duration-200">
                            <div className="relative w-16 h-16 flex-shrink-0 p-1">
                              <div className="relative w-full h-full rounded-lg overflow-hidden">
                                {firstImage ? (
                                  <Image
                                    src={firstImage}
                                    alt={listing.property_name}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
                                    <Home className="h-6 w-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-sm truncate text-gray-900 mb-1">
                                {listing.property_name}
                              </h4>
                              <p className="text-xs text-gray-600 truncate mb-2">
                                {listing.property_address || 'Address not available'}
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                            
                                € {listing.monthly_rent}/month
                              </p>
                            </div>
                            <div className="flex flex-col items-center gap-2 flex-shrink-0">
                              <Heart className="h-4 w-4 text-red-500 fill-current" />
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="text-xs px-3 py-1 h-8"
                                onClick={() => router.push(`/search?id=${listing.id}&view=detailed`)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {likedListings.length > 3 && (
                        <div className="pt-2 border-t border-gray-100">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setActiveTab('favorites')}
                            className="w-full text-sm"
                          >
                            View All Favorites ({likedListings.length})
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Applications Tab */}
          <TabsContent value="applications" className="space-y-6">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <User className="h-5 w-5 text-blue-600" />
                      All Applications
                    </CardTitle>
                    <CardDescription>
                      Complete list of your property applications
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/search')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Apply to Properties
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {applications.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-blue-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <User className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">No Applications Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start your property search and apply to places you'd love to live in. 
                      Your applications will appear here.
                    </p>
                    <Button onClick={() => router.push('/search')} size="lg">
                      <Home className="h-5 w-5 mr-2" />
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {applications.map((application) => (
                      <div key={application.id} className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 overflow-hidden">
                        <div className="flex">
                          {/* Property Image */}
                          <div className="w-48 flex-shrink-0 p-4">
                            <div className="relative w-full h-32 rounded-lg overflow-hidden">
                              {application.listing?.images && application.listing.images.length > 0 ? (
                                <Image
                                  src={application.listing.images[0]}
                                  alt={application.listing.property_name}
                                  fill
                                  sizes="192px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-lg">
                                  <Building2 className="h-10 w-10 text-gray-400" />
                                </div>
                              )}
                            </div>
                            
                            {/* Status and Price Badges Below Image */}
                            <div className="flex flex-col gap-2 mt-3">
                              {/* Status Badge */}
                              <Badge className={`${getStatusColor(application.status)} shadow-sm w-fit`}>
                                {getStatusIcon(application.status)}
                                <span className="ml-1 font-medium">{getStatusText(application.status)}</span>
                              </Badge>

                              {/* Price Badge */}
                              <div className="bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm border border-gray-200 w-fit">
                                <span className="text-sm font-bold text-gray-900">€{application.listing?.monthly_rent}</span>
                                <span className="text-xs text-gray-600">/month</span>
                              </div>
                            </div>
                          </div>

                          {/* Application Details */}
                          <div className="flex-1 p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">
                                  {application.listing?.property_name || 'Property Name'}
                                </h3>
                                <div className="flex items-center gap-2 text-gray-600 mb-3">
                                  <MapPin className="h-4 w-4 text-gray-500" />
                                  <span className="text-sm">
                                    {application.listing?.property_address || 'Address not available'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Application Info Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <span>Applied {new Date(application.created_at).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>{new Date(application.created_at).toLocaleTimeString()}</span>
                              </div>
                              {application.status === 'pending' && application.position && (
                                <div className="flex items-center gap-2 text-sm text-amber-600">
                                  <Users className="h-4 w-4" />
                                  <span>Position #{application.position} in queue</span>
                                </div>
                              )}
                            </div>

                            {/* Application Message */}
                            {application.message && (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-start gap-2">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <div>
                                    <p className="text-sm font-medium text-blue-900 mb-1">Your Application Message:</p>
                                    <p className="text-sm text-blue-800 leading-relaxed">{application.message}</p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (application.listing?.id) {
                                    await trackListingView(application.listing.id);
                                  }
                                  router.push(`/search?id=${application.listing?.id}&view=detailed`);
                                }}
                                className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                              >
                                <Eye className="h-4 w-4" />
                                View Property
                              </Button>
                              
                              {application.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openWithdrawDialog(application)}
                                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300"
                                  disabled={withdrawingApplicationId === application.id}
                                >
                                  {withdrawingApplicationId === application.id ? (
                                    <>
                                      <Loader2 className="h-4 w-4 animate-spin" />
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
                            </div>
                          </div>
                        </div>
                      </div>
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
                      My Property Listings
                    </CardTitle>
                    <CardDescription>
                      Properties you own and manage
                    </CardDescription>
                  </div>
                  <Button onClick={() => router.push('/listroom')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Listing
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {ownedListings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-purple-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <Building2 className="h-10 w-10 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">No Listings Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start earning by listing your property. Share your space with others and 
                      manage everything from this dashboard.
                    </p>
                    <Button onClick={() => router.push('/listroom')} size="lg">
                      <Plus className="h-5 w-5 mr-2" />
                      List Your Property
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {ownedListings.map((listing) => {
                      const mediaUrls = getMediaUrls(listing);
                      const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                      
                      return (
                        <Card key={listing.id} className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                          {/* Mobile: Stacked layout, Desktop: Side-by-side */}
                          <div className="flex flex-col lg:flex-row">
                            {/* Left side - Image and basic info */}
                            <div className="w-full lg:w-1/2">
                              <div className="relative h-48 lg:h-48">
                                <Image
                                  src={firstImage || '/bedroom.PNG'}
                                  alt={listing.property_name || 'Property'}
                                  fill
                                  sizes="(max-width: 1024px) 100vw, 50vw"
                                  className="object-cover"
                                />
                                <div className="absolute top-3 right-3">
                                  <Badge className="bg-white/95 text-gray-800 font-semibold shadow-lg">
                                    €{listing.monthly_rent}
                                  </Badge>
                                </div>
                              </div>
                              <div className="p-4">
                                <h4 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900">
                                  {listing.property_name}
                                </h4>
                                <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                                  <MapPin className="h-4 w-4" />
                                  {listing.city}, {listing.county}
                                </p>
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1 text-xs text-emerald-600">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>{listing.applicants?.count || 0} applicants</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                      <Eye className="h-3 w-3" />
                                      <span>{listing.views_count || 0} views</span>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Action Buttons */}
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 text-xs"
                                    onClick={async () => {
                                      await trackListingView(listing.id);
                                      router.push(`/search?id=${listing.id}&view=detailed`);
                                    }}
                                  >
                                    View
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => router.push(`/edit-listing/${listing.id}`)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    className="flex-1 text-xs"
                                    onClick={() => router.push(`/applications/${listing.id}`)}
                                  >
                                    Manage
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    className="flex-1 text-xs"
                                    onClick={() => {
                                      setSelectedListingForDelete(listing);
                                      setShowDeleteDialog(true);
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Right side - Payment status */}
                            <div className="w-full lg:w-1/2 p-4">
                              <PaymentStatusCard 
                                key={`${listing.id}-${refreshTrigger}`}
                                listing={listing}
                                onStatusUpdate={async () => {
                                  // Refresh the data to update listing status
                                  console.log('PaymentStatusCard requesting data refresh...');
                                  await fetchAllData();
                                  setRefreshTrigger(prev => prev + 1);
                                }}
                              />
                            </div>
                          </div>
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
                  Properties you've saved for future consideration
                </CardDescription>
              </CardHeader>
              <CardContent>
                {likedListings.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                      <Heart className="h-10 w-10 text-red-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">No Favorites Yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start browsing properties and save the ones you like. 
                      They'll appear here for easy access later.
                    </p>
                    <Button onClick={() => router.push('/search')} size="lg">
                      <Heart className="h-5 w-5 mr-2" />
                      Browse Properties
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {likedListings.map((listing) => {
                      const mediaUrls = getMediaUrls(listing);
                      const firstImage = mediaUrls.length > 0 ? mediaUrls[0].url : null;
                      
                      return (
                        <Card key={listing.id} className="border shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden">
                          <div className="relative h-48">
                            {firstImage ? (
                              <Image
                                src={firstImage}
                                alt={listing.property_name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                <Home className="h-12 w-12 text-gray-400" />
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
                            {!listing.active && (
                              <div className="absolute bottom-3 left-3">
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  No Longer Available
                                </Badge>
                              </div>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-lg mb-2 line-clamp-1 text-gray-900">
                              {listing.property_name}
                            </h4>
                            <p className="text-sm text-gray-600 flex items-center gap-2 mb-3">
                              <MapPin className="h-4 w-4" />
                              {listing.city}, {listing.county}
                            </p>
                            <div className="flex items-center justify-between">
                              {/* <Badge variant="outline" className="text-xs">
                                {listing.room_type}
                              </Badge> */}
                                                              <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex-1 text-xs sm:text-sm"
                                  onClick={() => router.push(`/search?id=${listing.id}&view=detailed`)}
                                >
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
        <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-5 w-5" />
                Withdraw Application
              </DialogTitle>
              <DialogDescription className="text-red-600">
                Are you sure you want to withdraw your application? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            
            {selectedApplication && (
              <div className="space-y-4">
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900">{selectedApplication.listing.property_name}</h4>
                  <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    {selectedApplication.listing.city}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Current position: #{selectedApplication.position} in queue
                  </p>
                </div>
                
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <h4 className="font-medium text-red-800 mb-2">What happens when you withdraw:</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Your application will be removed from the queue</li>
                    <li>• You'll lose your current position</li>
                    <li>• You can reapply, but you'll start at the end of the queue</li>
                  </ul>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowWithdrawDialog(false);
                  setSelectedApplication(null);
                }}
                disabled={withdrawingApplicationId === selectedApplication?.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => selectedApplication && handleWithdrawApplication(selectedApplication.id)}
                disabled={withdrawingApplicationId === selectedApplication?.id}
                className="flex items-center gap-2"
              >
                {withdrawingApplicationId === selectedApplication?.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Withdrawing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" />
                    Yes, Withdraw
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Listing Dialog */}
        {selectedListingForDelete && (
          <DeleteListingDialog
            isOpen={showDeleteDialog}
            onClose={() => {
              setShowDeleteDialog(false);
              setSelectedListingForDelete(null);
            }}
            onDelete={() => {
              // Refetch the listings data after deletion
              fetchAllData();
            }}
            listing={selectedListingForDelete}
          />
        )}
      </div>
    </div>
  );
} 