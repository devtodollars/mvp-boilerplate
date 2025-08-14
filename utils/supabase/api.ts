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
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  const checkUserExists = async (email: string): Promise<boolean> => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required to check user existence');
    }

    try {
      console.log('Checking if user exists for email:', email);
      
      // Use Supabase's admin API to check if user exists
      // This is a safe way to check without exposing user data
      const { data, error } = await supabase.rpc('check_user_exists', {
        email_to_check: email
      });

      if (error) {
        // If the RPC function doesn't exist, fall back to a different method
        console.log('RPC function not available, using alternative method');
        
        // Alternative: Try to sign in with a dummy password to check if user exists
        // This will fail but give us info about whether the user exists
        try {
          await supabase.auth.signInWithPassword({
            email,
            password: 'dummy_password_for_check_only'
          });
          // If this succeeds (unlikely), user exists
          return true;
        } catch (signInError: any) {
          // Check the error message to determine if user exists
          if (signInError?.message?.includes('Invalid login credentials')) {
            // User exists but password is wrong
            return true;
          } else if (signInError?.message?.includes('Email not confirmed')) {
            // User exists but email not confirmed
            return true;
          } else {
            // User likely doesn't exist
            return false;
          }
        }
      }

      return !!data;
    } catch (error) {
      console.error('Error checking user existence:', error);
      // If we can't check, assume user doesn't exist to allow signup attempt
      return false;
    }
  };

  const passwordSignup = async (creds: SignUpWithPasswordCredentials) => {
    if (!creds) {
      throw new Error('Credentials are required for signup');
    }

    // Handle both email and phone signup
    const email = 'email' in creds ? creds.email : undefined;
    const phone = 'phone' in creds ? creds.phone : undefined;
    const password = creds.password;
    
    if (!email && !phone) {
      throw new Error('Valid email or phone is required for signup');
    }

    if (!password || typeof password !== 'string') {
      throw new Error('Valid password is required for signup');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    try {
      // Check if user already exists (only for email signup)
      if (email) {
        console.log('Checking if user already exists before signup...');
        const userExists = await checkUserExists(email);
        
        if (userExists) {
          return {
            user: null,
            session: null,
            error: { message: 'An account with this email already exists. Please sign in instead.', code: 'user_already_exists' }
          };
        }
        
        console.log('User does not exist, proceeding with signup...');
      }

      // Try to sign up the user
      const signUpData: any = { password };
      if (email) signUpData.email = email;
      if (phone) signUpData.phone = phone;
      
      const res = await supabase.auth.signUp({
        ...signUpData,
        options: {
          emailRedirectTo: getURL('/api/auth_callback')
        }
      });
      
      if (res.error) {
        // Handle specific error cases with better messages
        if (res.error.message.includes('User already registered')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        } else if (res.error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link to complete your registration.');
        } else if (res.error.message.includes('Signup disabled')) {
          throw new Error('Signup is currently disabled. Please contact support.');
        } else if (res.error.message.includes('Invalid email')) {
          throw new Error('Please enter a valid email address.');
        } else {
          throw res.error;
        }
      }
      
      return res.data;
    } catch (error) {
      console.error('Error in passwordSignup:', error);
      throw error;
    }
  };
  
  const verifyOtp = async (email: string, token: string) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required for OTP verification');
    }

    if (!token || typeof token !== 'string') {
      throw new Error('Valid token is required for OTP verification');
    }

    try {
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
        } else if (res.error.message.includes('Email not confirmed')) {
          throw new Error('Email not confirmed. Please check your email and click the confirmation link.');
        } else {
          throw res.error;
        }
      }
      
      return res.data;
    } catch (error) {
      console.error('Error in verifyOtp:', error);
      throw error;
    }
  };

  const passwordSignin = async (creds: SignInWithPasswordCredentials) => {
    if (!creds) {
      throw new Error('Credentials are required for signin');
    }

    // Handle both email and phone signin
    const email = 'email' in creds ? creds.email : undefined;
    const phone = 'phone' in creds ? creds.phone : undefined;
    const password = creds.password;
    
    if (!email && !phone) {
      throw new Error('Valid email or phone is required for signin');
    }

    if (!password || typeof password !== 'string') {
      throw new Error('Valid password is required for signin');
    }
    
    try {
      // Try to sign in the user
      const signInData: any = { password };
      if (email) signInData.email = email;
      if (phone) signInData.phone = phone;
      
      const res = await supabase.auth.signInWithPassword(signInData);
      if (res.error) {
        // Handle specific error cases with better messages
        if (res.error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (res.error.message.includes('Email not confirmed')) {
          throw new Error('Please check your email and click the confirmation link to complete your registration.');
        } else {
          throw res.error;
        }
      }
      return res.data;
    } catch (error) {
      console.error('Error in passwordSignin:', error);
      throw error;
    }
  };

  const passwordReset = async (email: string) => {
    if (!email || typeof email !== 'string') {
      throw new Error('Valid email is required for password reset');
    }

    try {
      const res = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getURL('/api/reset_password')
      });
      if (res.error) {
        if (res.error.message.includes('User not found')) {
          throw new Error('No account found with this email address.');
        } else {
          throw res.error;
        }
      }
      return res.data;
    } catch (error) {
      console.error('Error in passwordReset:', error);
      throw error;
    }
  };

  const passwordUpdate = async (password: string) => {
    if (!password || typeof password !== 'string') {
      throw new Error('Valid password is required for password update');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }

    try {
      const res = await supabase.auth.updateUser({ password });
      if (res.error) {
        if (res.error.message.includes('Password should be at least')) {
          throw new Error('Password must be at least 6 characters long.');
        } else {
          throw res.error;
        }
      }
      return res.data;
    } catch (error) {
      console.error('Error in passwordUpdate:', error);
      throw error;
    }
  };

  const oauthSignin = async (provider: Provider) => {
    if (!provider || typeof provider !== 'string') {
      throw new Error('Valid provider is required for OAuth signin');
    }

    const validProviders = ['google', 'github', 'facebook', 'twitter'];
    if (!validProviders.includes(provider)) {
      throw new Error(`Invalid provider. Supported providers: ${validProviders.join(', ')}`);
    }

    try {
      const res = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getURL('/api/auth_callback')
        }
      });
      if (res.error) throw res.error;
      return res.data;
    } catch (error) {
      console.error('Error in oauthSignin:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const res = await supabase.auth.signOut();
      if (res.error) throw res.error;
      return res;
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  };

  const createUserProfile = async (userData: UserForm & { email: string }, user?: any) => {
    if (!userData) {
      throw new Error('User data is required');
    }

    if (!userData.email || typeof userData.email !== 'string') {
      throw new Error('Valid email is required');
    }

    if (!userData.first_name || typeof userData.first_name !== 'string') {
      throw new Error('First name is required');
    }

    if (!userData.last_name || typeof userData.last_name !== 'string') {
      throw new Error('Last name is required');
    }

    console.log('createUserProfile called with:', userData);
    
    try {
      // User must be provided - no fallback auth calls
      if (!user) throw new Error('User not authenticated');
      const currentUser = user;

      // Check if profile already exists
      const { data: existingProfile, error: profileError } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', currentUser.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for new users
        console.error('Error checking existing profile:', profileError);
        throw new Error(`Failed to check existing profile: ${profileError.message}`);
      }

      if (existingProfile) {
        console.log('Profile already exists, updating:', existingProfile);
        
        // If profile exists but is incomplete (only has basic fields from trigger),
        // we should still allow the update
        if (!existingProfile.first_name || !existingProfile.last_name) {
          console.log('Profile exists but is incomplete, proceeding with update');
        } else {
          console.log('Profile is complete, updating with new data');
        }
      } else {
        console.log('Creating new profile for user:', user.id);
      }

      // Convert DD/MM/YYYY to YYYY-MM-DD for database
      let formattedDateOfBirth = null;
      if (userData.date_of_birth) {
        try {
          const [day, month, year] = userData.date_of_birth.split('/');
          if (day && month && year) {
            // Format as YYYY-MM-DD for PostgreSQL date type
            formattedDateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        } catch (error) {
          console.warn('Invalid date format, using null:', userData.date_of_birth);
        }
      }

      const profileData = {
        id: currentUser.id,
        first_name: userData.first_name,
        last_name: userData.last_name,
        full_name: `${userData.first_name} ${userData.last_name}`,
        phone: userData.phone || undefined,
        bio: userData.bio || undefined,
        avatar_id: userData.avatar_id || undefined,
        date_of_birth: formattedDateOfBirth,
        occupation: userData.occupation || undefined,
        marital_status: userData.marital_status || undefined,
        gender: userData.gender || undefined,
        smoker: userData.smoker || false,
        pets: userData.pets || false,
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
    } catch (error) {
      console.error('Error in createUserProfile:', error);
      throw error;
    }
  };

  const checkProfileCompletion = async (user?: any): Promise<{ completed: boolean; profile?: any }> => {
    try {
      // User must be provided - no fallback auth calls
      if (!user) {
        console.warn('checkProfileCompletion called without user parameter');
        return { completed: false };
      }
      const currentUser = user;
      
      if (!currentUser) {
        return { completed: false };
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
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
  const applyToProperty = async (listingId: string, notes?: string, user?: any) => {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Valid listing ID is required');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Applying to property:', { listingId, userId: currentUser.id, notes });

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

  const getUserApplications = async (user?: any) => {
    try {
      // User must be provided - no fallback auth calls
      if (!user) {
        console.warn('getUserApplications called without user parameter');
        return { success: false, applications: [] };
      }
      const currentUser = user;
      
      if (!currentUser) {
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

  const getListingApplications = async (listingId: string, user?: any) => {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Valid listing ID is required');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // First check if user owns the listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('user_id')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;

      if (listing.user_id !== currentUser.id) {
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

  const updateApplicationStatus = async (applicationId: string, status: 'accepted' | 'rejected' | 'withdrawn', notes?: string, user?: any) => {
    if (!applicationId || typeof applicationId !== 'string') {
      throw new Error('Valid application ID is required');
    }

    if (!status || !['accepted', 'rejected', 'withdrawn'].includes(status)) {
      throw new Error('Valid status is required: accepted, rejected, or withdrawn');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
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
    if (!applicationId || typeof applicationId !== 'string') {
      throw new Error('Valid application ID is required');
    }

    return updateApplicationStatus(applicationId, 'withdrawn');
  };

  const checkUserApplication = async (listingId: string, user?: any) => {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Valid listing ID is required');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        return { hasApplied: false, application: null };
      }

      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('listing_id', listingId)
        .eq('user_id', currentUser.id)
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
  const toggleLikeListing = async (listingId: string, user?: any) => {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Valid listing ID is required');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Get current user's liked listings
      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('liked_listings')
        .eq('id', currentUser.id)
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
        .eq('id', currentUser.id);

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

  const getUserLikedListings = async (user?: any) => {
    try {
      console.log('getUserLikedListings: Starting...');
      // User must be provided - no fallback auth calls
      if (!user) {
        console.warn('getUserLikedListings called without user parameter');
        return { success: false, listings: [] };
      }
      const currentUser = user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('getUserLikedListings: User found:', currentUser.id);
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

  const checkIfListingLiked = async (listingId: string, user?: any) => {
    if (!listingId || typeof listingId !== 'string') {
      throw new Error('Valid listing ID is required');
    }

    try {
      // Use provided user or fetch if not provided (for backward compatibility)
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        return { success: false, isLiked: false };
      }

      const { data: userData, error: userDataError } = await supabase
        .from('users')
        .select('liked_listings')
        .eq('id', currentUser.id)
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
    checkUserExists,
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
