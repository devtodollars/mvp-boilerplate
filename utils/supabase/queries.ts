import { SupabaseClient } from '@supabase/supabase-js';
import { cache } from 'react';

export const getUser = cache(async (supabase: SupabaseClient) => {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  try {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      throw error;
    }
    
    return user;
  } catch (error) {
    console.error('Error in getUser:', error);
    throw error;
  }
});



export const getUserDetails = cache(async (supabase: SupabaseClient) => {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  try {
    const { data: userDetails, error } = await supabase
      .from('users')
      .select('*')
      .single();

    if (error) {
      console.error('Error getting user details:', error);
      throw error;
    }

    return userDetails;
  } catch (error) {
    console.error('Error in getUserDetails:', error);
    throw error;
  }
});
