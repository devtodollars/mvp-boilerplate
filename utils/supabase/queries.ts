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

export const getSubscription = cache(async (supabase: SupabaseClient) => {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .order('created', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }

    return subscription;
  } catch (error) {
    console.error('Error in getSubscription:', error);
    throw error;
  }
});

export const getProducts = cache(async (supabase: SupabaseClient) => {
  if (!supabase) {
    throw new Error('Supabase client is required');
  }

  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('active', true)
      .eq('prices.active', true)
      .order('metadata->index')
      .order('unit_amount', { referencedTable: 'prices' });

    if (error) {
      console.error('Error getting products:', error);
      throw error;
    }

    return products;
  } catch (error) {
    console.error('Error in getProducts:', error);
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
