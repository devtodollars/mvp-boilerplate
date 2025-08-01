import { Database } from '@/types_db';
import {
  Provider,
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  SupabaseClient
} from '@supabase/supabase-js';
import { getURL } from '@/utils/helpers';
import { UserForm } from '@/schemas/user';

export const createApiClient = (supabase: SupabaseClient<Database>) => {
  const passwordSignup = async (creds: SignUpWithPasswordCredentials) => {
    // Use OTP for email verification instead of confirmation URL
    const email = 'email' in creds ? creds.email : undefined;
    const password = creds.password;
    
    if (!email) {
      throw new Error('Email is required for signup');
    }
    
    const res = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: {
          password, // Store password for later use
        }
      }
    });
    
    if (res.error) {
      // Handle specific error cases with better messages
      if (res.error.message.includes('User already registered')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else if (res.error.message.includes('Invalid login credentials')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      } else {
        throw res.error;
      }
    }
    
    return res.data;
  };
  
  const verifyOtp = async (email: string, token: string) => {
    const res = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    
    if (res.error) {
      // Handle specific error cases with better messages
      if (res.error.message.includes('Invalid OTP')) {
        throw new Error('Invalid verification code. Please check your email and try again.');
      } else if (res.error.message.includes('Token expired')) {
        throw new Error('Verification code has expired. Please request a new one.');
      } else {
        throw res.error;
      }
    }
    
    return res.data;
  };
  const passwordSignin = async (creds: SignInWithPasswordCredentials) => {
    const res = await supabase.auth.signInWithPassword(creds);
    if (res.error) throw res.error;
    return res.data;
  };
  const passwordReset = async (email: string) => {
    const res = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getURL('/api/reset_password')
    });
    console.log(res);
    if (res.error) throw res.error;
    return res.data;
  };
  const passwordUpdate = async (password: string) => {
    const res = await supabase.auth.updateUser({ password });
    if (res.error) throw res.error;
    return res.data;
  };
  const oauthSignin = async (provider: Provider) => {
    const res = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getURL('/api/auth_callback')
      }
    });
    if (res.error) throw res.error;
    return res.data;
  };
  const signOut = async () => {
    const res = await supabase.auth.signOut();
    if (res.error) throw res.error;
    return res;
  };
  const createUserProfile = async (userData: UserForm & { email: string }) => {
    console.log('createUserProfile called with:', userData);
    
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current user:', user);
    
    if (!user) throw new Error('User not authenticated');

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (existingProfile) {
      console.log('Profile already exists, updating:', existingProfile);
    } else {
      console.log('Creating new profile for user:', user.id);
    }

    // Convert DD/MM/YYYY to YYYY-MM-DD for database
    let formattedDateOfBirth = null;
    if (userData.date_of_birth) {
      const [day, month, year] = userData.date_of_birth.split('/');
      formattedDateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }

    const profileData = {
      id: user.id,
      first_name: userData.first_name,
      last_name: userData.last_name,
      full_name: `${userData.first_name} ${userData.last_name}`,
      phone: userData.phone,
      bio: userData.bio,
      avatar_id: userData.avatar_id,
      date_of_birth: formattedDateOfBirth,
      occupation: userData.occupation,
      marital_status: userData.marital_status,
      gender: userData.gender,
      smoker: userData.smoker,
      pets: userData.pets,
      verified: false,
      successful_applications: [],
      rejected_applications: [],
      pending_applications: [],
      owned_listings: [],
      liked_listings: [],
      uploaded_documents: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log('Profile data to insert:', profileData);

    const { data, error } = await supabase
      .from('users')
      .upsert(profileData)
      .select();

    console.log('Upsert result:', { data, error });

    if (error) {
      console.error('Database error:', error);
      throw new Error(`Failed to create user profile: ${error.message}`);
    }
    
    if (!data || data.length === 0) {
      console.error('No data returned from upsert');
      throw new Error('Failed to create user profile: No data returned');
    }
    
    console.log('Profile created successfully:', data);
    return { success: true, data: data[0] };
  };



  const checkProfileCompletion = async (): Promise<{ completed: boolean; profile?: any }> => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { completed: false };
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // PGRST116 means no rows returned (profile doesn't exist)
        if (profileError.code === 'PGRST116') {
          return { completed: false };
        }
        console.error('Error checking profile completion:', profileError);
        return { completed: false };
      }

      // Check if profile has required fields
      const hasRequiredFields = profile && 
        profile.first_name && 
        profile.last_name && 
        profile.phone && 
        profile.bio && 
        profile.occupation && 
        profile.date_of_birth;

      return { 
        completed: !!hasRequiredFields, 
        profile: hasRequiredFields ? profile : null 
      };
    } catch (error) {
      console.error('Error in checkProfileCompletion:', error);
      return { completed: false };
    }
  };

  // Application functions
  const applyToProperty = async (listingId: string, notes?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('Applying to property:', { listingId, userId: user.id, notes });

      // Use the server API endpoint instead of calling the database function directly
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          notes
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create application');
      }

      const result = await response.json();
      console.log('API result:', result);

      return { success: true, applicationId: result.applicationId };
    } catch (error) {
      console.error('Error applying to property:', error);
      throw error;
    }
  };

  const getUserApplications = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          listing:listings(
            id,
            property_name,
            address,
            city,
            county,
            monthly_rent,
            property_type,
            room_type,
            images
          )
        `)
        .eq('user_id', user.id)
        .order('applied_at', { ascending: false });

      if (error) throw error;

      return { success: true, applications: data };
    } catch (error) {
      console.error('Error fetching user applications:', error);
      throw error;
    }
  };

  const getListingApplications = async (listingId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // First check if user owns the listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;

      if (listing.user_id !== user.id) {
        throw new Error('Unauthorized: You can only view applications for your own listings');
      }

      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          user:users(
            id,
            first_name,
            last_name,
            email,
            phone,
            bio,
            occupation
          )
        `)
        .eq('listing_id', listingId)
        .order('position', { ascending: true });

      if (error) throw error;

      return { success: true, applications: data };
    } catch (error) {
      console.error('Error fetching listing applications:', error);
      throw error;
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected' | 'withdrawn', notes?: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('update_application_status', {
        application_uuid: applicationId,
        new_status: status,
        review_notes: notes || null
      });

      if (error) throw error;

      return { success: true, updated: data };
    } catch (error) {
      console.error('Error updating application status:', error);
      throw error;
    }
  };

  const withdrawApplication = async (applicationId: string) => {
    return updateApplicationStatus(applicationId, 'withdrawn');
  };

  const checkUserApplication = async (listingId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { hasApplied: false, application: null };
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('listing_id', listingId)
        .eq('user_id', user.id)
        .maybeSingle(); // Use maybeSingle() instead of single() to handle no rows gracefully

      if (error) {
        console.error('Error checking user application:', error);
        return { hasApplied: false, application: null };
      }

      // maybeSingle() returns null if no rows found, which is what we want
      return { hasApplied: !!data, application: data };
    } catch (error) {
      console.error('Error checking user application:', error);
      return { hasApplied: false, application: null };
    }
  };

  // Like/Unlike functions
  const toggleLikeListing = async (listingId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get current user's liked listings
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('liked_listings')
        .eq('id', user.id)
        .single();

      if (userDataError) throw userDataError;

      const currentLikedListings = userData.liked_listings || [];
      const isCurrentlyLiked = currentLikedListings.includes(listingId as any);

      let newLikedListings: any[];
      if (isCurrentlyLiked) {
        // Remove from liked listings
        newLikedListings = currentLikedListings.filter(id => id !== listingId);
      } else {
        // Add to liked listings
        newLikedListings = [...currentLikedListings, listingId];
      }

      // Update user's liked listings
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          liked_listings: newLikedListings,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      return { 
        success: true, 
        isLiked: !isCurrentlyLiked,
        likedListings: newLikedListings
      };
    } catch (error) {
      console.error('Error toggling like listing:', error);
      throw error;
    }
  };

  const getUserLikedListings = async () => {
    try {
      console.log('getUserLikedListings: Starting...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      console.log('getUserLikedListings: User found:', user.id);
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('liked_listings')
        .eq('id', user.id)
        .single();

      if (userDataError) {
        console.error('getUserLikedListings: Error fetching user data:', userDataError);
        throw userDataError;
      }

      console.log('getUserLikedListings: User data:', userData);
      const likedListingIds = userData.liked_listings || [];

      console.log('getUserLikedListings: Liked listing IDs:', likedListingIds);

      if (likedListingIds.length === 0) {
        console.log('getUserLikedListings: No liked listings found');
        return { success: true, listings: [] };
      }

      // Fetch the actual listing data for liked listings
      console.log('getUserLikedListings: About to query listings with IDs:', likedListingIds);
      
      // First, let's check if the listing exists at all (without the active filter)
      const { data: allListings, error: allListingsError } = await supabase
        .from('listings')
        .select('*')
        .in('id', likedListingIds);
      
      console.log('getUserLikedListings: All listings found (without active filter):', allListings);
      if (allListings && allListings.length > 0) {
        console.log('getUserLikedListings: First listing active status:', allListings[0].active);
        console.log('getUserLikedListings: First listing full data:', allListings[0]);
      }
      
      // Get all liked listings (both active and inactive) so users can see their favorites
      const { data: listings, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .in('id', likedListingIds)
        .order('created_at', { ascending: false });

      if (listingsError) {
        console.error('getUserLikedListings: Error fetching listings:', listingsError);
        throw listingsError;
      }

      console.log('getUserLikedListings: Fetched listings:', listings);
      console.log('getUserLikedListings: Number of listings found:', listings?.length || 0);
      console.log('getUserLikedListings: First listing:', listings?.[0]);
      return { success: true, listings: listings || [] };
    } catch (error) {
      console.error('Error fetching user liked listings:', error);
      throw error;
    }
  };

  const checkIfListingLiked = async (listingId: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        return { success: false, isLiked: false };
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('liked_listings')
        .eq('id', user.id)
        .single();

      if (userDataError) throw userDataError;

      const likedListings = userData.liked_listings || [];
      const isLiked = likedListings.includes(listingId as any);

      return { success: true, isLiked };
    } catch (error) {
      console.error('Error checking if listing is liked:', error);
      throw error;
    }
  };

  return {
    passwordSignin,
    passwordSignup,
    passwordReset,
    passwordUpdate,
    oauthSignin,
    signOut,
    createUserProfile,
    verifyOtp,
    checkProfileCompletion,
    applyToProperty,
    getUserApplications,
    getListingApplications,
    updateApplicationStatus,
    withdrawApplication,
    checkUserApplication,
    toggleLikeListing,
    getUserLikedListings,
    checkIfListingLiked
  };
};
