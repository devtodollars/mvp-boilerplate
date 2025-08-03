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
  const supabase = createClient();
  
  try {
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
  const supabase = createClient();
  
  try {
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
  const supabase = createClient();
  
  try {
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
  const supabase = createClient();
  
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (stripePaymentIntentId) {
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
  const supabase = createClient();
  
  try {
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
  const supabase = createClient();
  
  try {
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
};

// Simulate payment completion (for testing before Stripe integration)
export const simulatePaymentCompletion = async (listingId: string): Promise<boolean> => {
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
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('status, amount, created_at')
      .eq('user_id', userId);

    if (error) {
      console.error('Error getting payment stats:', error);
      return { data: null, error };
    }

    const stats = {
      totalPayments: data.length,
      totalAmount: data.reduce((sum, payment) => sum + Number(payment.amount), 0),
      completedPayments: data.filter(p => p.status === 'completed').length,
      pendingPayments: data.filter(p => p.status === 'pending').length,
      failedPayments: data.filter(p => p.status === 'failed').length,
      thisMonth: data.filter(p => {
        const paymentDate = new Date(p.created_at);
        const now = new Date();
        return paymentDate.getMonth() === now.getMonth() && 
               paymentDate.getFullYear() === now.getFullYear();
      }).length
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error('Error in getPaymentStats:', error);
    return { data: null, error };
  }
}; 