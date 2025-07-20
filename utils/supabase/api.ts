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



  return {
    passwordSignin,
    passwordSignup,
    passwordReset,
    passwordUpdate,
    oauthSignin,
    signOut,
    createUserProfile,
    verifyOtp
  };
};
