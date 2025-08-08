import { createClient } from './client';
import type { Database } from '@/types_db';

export type PaymentStatus = 'unpaid' | 'paid' | 'expired' | 'cancelled';
export type PaymentMethod = 'stripe' | 'manual' | 'test';

export interface PaymentInfo {
  listing_id: string;
  payment_status: PaymentStatus;
  payment_expires_at: string | null;
  payment_amount: number;
  days_remaining: number | null;
  is_active: boolean;
  can_renew: boolean;
}

export interface CreatePaymentData {
  listing_id: string;
  user_id: string;
  amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  description?: string;
  metadata?: Record<string, any>;
}

// Get payment information for a listing
export const getListingPaymentInfo = async (listingId: string): Promise<PaymentInfo | null> => {
  if (!listingId || typeof listingId !== 'string') {
    console.warn('Invalid listing ID provided to getListingPaymentInfo:', listingId);
    return null;
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return null;
    }

    const { data, error } = await supabase.rpc('get_listing_payment_info', {
      listing_uuid: listingId
    });

    if (error) {
      console.error('Error getting payment info:', error);
      return null;
    }

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error in getListingPaymentInfo:', error);
    return null;
  }
};

// Extend listing payment (for when payment is made)
export const extendListingPayment = async (listingId: string, days: number = 30): Promise<boolean> => {
  if (!listingId || typeof listingId !== 'string') {
    console.warn('Invalid listing ID provided to extendListingPayment:', listingId);
    return false;
  }

  if (!days || typeof days !== 'number' || days <= 0) {
    console.warn('Invalid days parameter provided to extendListingPayment:', days);
    days = 30;
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return false;
    }

    const { data, error } = await supabase.rpc('extend_listing_payment', {
      listing_uuid: listingId,
      days_to_add: days
    });

    if (error) {
      console.error('Error extending payment:', error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error('Error in extendListingPayment:', error);
    return false;
  }
};

// Create a payment record
export const createPaymentRecord = async (paymentData: CreatePaymentData) => {
  if (!paymentData) {
    console.warn('Payment data is required');
    return { data: null, error: new Error('Payment data is required') };
  }

  if (!paymentData.listing_id || typeof paymentData.listing_id !== 'string') {
    console.warn('Valid listing ID is required');
    return { data: null, error: new Error('Valid listing ID is required') };
  }

  if (!paymentData.user_id || typeof paymentData.user_id !== 'string') {
    console.warn('Valid user ID is required');
    return { data: null, error: new Error('Valid user ID is required') };
  }

  if (!paymentData.amount || typeof paymentData.amount !== 'number' || paymentData.amount <= 0) {
    console.warn('Valid amount is required');
    return { data: null, error: new Error('Valid amount is required') };
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { data: null, error: new Error('Failed to create Supabase client') };
    }

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        listing_id: paymentData.listing_id,
        user_id: paymentData.user_id,
        amount: paymentData.amount,
        currency: paymentData.currency || 'EUR',
        status: 'pending',
        payment_method: paymentData.payment_method || 'manual',
        description: paymentData.description || `Payment for listing ${paymentData.listing_id}`,
        metadata: paymentData.metadata || {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment record:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createPaymentRecord:', error);
    return { data: null, error };
  }
};

// Update payment status
export const updatePaymentStatus = async (
  paymentId: string, 
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled',
  stripePaymentIntentId?: string
) => {
  if (!paymentId || typeof paymentId !== 'string') {
    console.warn('Valid payment ID is required');
    return { data: null, error: new Error('Valid payment ID is required') };
  }

  if (!status || typeof status !== 'string') {
    console.warn('Valid status is required');
    return { data: null, error: new Error('Valid status is required') };
  }

  const validStatuses = ['pending', 'completed', 'failed', 'refunded', 'cancelled'];
  if (!validStatuses.includes(status)) {
    console.warn('Invalid payment status:', status);
    return { data: null, error: new Error('Invalid payment status') };
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { data: null, error: new Error('Failed to create Supabase client') };
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (stripePaymentIntentId && typeof stripePaymentIntentId === 'string') {
      updateData.stripe_payment_intent_id = stripePaymentIntentId;
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment status:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updatePaymentStatus:', error);
    return { data: null, error };
  }
};

// Get user's payment history
export const getUserPayments = async (userId: string) => {
  if (!userId || typeof userId !== 'string') {
    console.warn('Valid user ID is required');
    return { data: null, error: new Error('Valid user ID is required') };
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { data: null, error: new Error('Failed to create Supabase client') };
    }

    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        listings (
          id,
          property_name,
          address,
          city,
          county
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user payments:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getUserPayments:', error);
    return { data: null, error };
  }
};

// Get payments for a specific listing
export const getListingPayments = async (listingId: string) => {
  if (!listingId || typeof listingId !== 'string') {
    console.warn('Valid listing ID is required');
    return { data: null, error: new Error('Valid listing ID is required') };
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { data: null, error: new Error('Failed to create Supabase client') };
    }

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('listing_id', listingId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting listing payments:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in getListingPayments:', error);
    return { data: null, error };
  }
};

// Check if a listing needs payment
export const checkListingPaymentNeeded = async (listingId: string): Promise<{
  needsPayment: boolean;
  paymentInfo: PaymentInfo | null;
  reason: string;
}> => {
  if (!listingId || typeof listingId !== 'string') {
    console.warn('Valid listing ID is required');
    return {
      needsPayment: true,
      paymentInfo: null,
      reason: 'Invalid listing ID provided'
    };
  }

  try {
    const paymentInfo = await getListingPaymentInfo(listingId);
    
    if (!paymentInfo) {
      return {
        needsPayment: true,
        paymentInfo: null,
        reason: 'Payment information not found'
      };
    }

    if (paymentInfo.payment_status === 'unpaid') {
      return {
        needsPayment: true,
        paymentInfo,
        reason: 'Listing has not been paid for'
      };
    }

    if (paymentInfo.payment_status === 'expired') {
      return {
        needsPayment: true,
        paymentInfo,
        reason: 'Payment has expired'
      };
    }

    if (paymentInfo.payment_status === 'paid' && paymentInfo.days_remaining !== null && paymentInfo.days_remaining <= 7) {
      return {
        needsPayment: true,
        paymentInfo,
        reason: `Payment expires in ${paymentInfo.days_remaining} days`
      };
    }

    return {
      needsPayment: false,
      paymentInfo,
      reason: 'Payment is current'
    };
  } catch (error) {
    console.error('Error in checkListingPaymentNeeded:', error);
    return {
      needsPayment: true,
      paymentInfo: null,
      reason: 'Error checking payment status'
    };
  }
};

// Simulate payment completion (for testing before Stripe integration)
export const simulatePaymentCompletion = async (listingId: string): Promise<boolean> => {
  if (!listingId || typeof listingId !== 'string') {
    console.warn('Valid listing ID is required for payment simulation');
    return false;
  }

  try {
    const response = await fetch('/api/payments/simulate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ listingId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment simulation failed');
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('Error in simulatePaymentCompletion:', error);
    return false;
  }
};

// Get payment statistics for dashboard
export const getPaymentStats = async (userId: string) => {
  if (!userId || typeof userId !== 'string') {
    console.warn('Valid user ID is required');
    return { data: null, error: new Error('Valid user ID is required') };
  }

  try {
    const supabase = createClient();
    
    if (!supabase) {
      console.error('Failed to create Supabase client');
      return { data: null, error: new Error('Failed to create Supabase client') };
    }

    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting payment stats:', error);
      return { data: null, error };
    }

    if (!data || !Array.isArray(data)) {
      console.warn('Invalid payment data received');
      return { data: null, error: new Error('Invalid payment data received') };
    }

    const stats = {
      totalPayments: data.length,
      totalAmount: data.reduce((sum, payment) => {
        const amount = Number(payment.amount) || 0;
        return sum + amount;
      }, 0),
      completedPayments: data.filter(p => p.status === 'completed').length,
      pendingPayments: data.filter(p => p.status === 'pending').length,
      failedPayments: data.filter(p => p.status === 'failed').length,
      thisMonth: data.filter(p => {
        try {
          const paymentDate = new Date(p.created_at);
          const now = new Date();
          return paymentDate.getMonth() === now.getMonth() && 
                 paymentDate.getFullYear() === now.getFullYear();
        } catch (error) {
          console.warn('Invalid payment date:', p.created_at);
          return false;
        }
      }).length
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    return { data: null, error };
  }
}; 