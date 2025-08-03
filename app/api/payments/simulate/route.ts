import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();
    
    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Verify listing ownership
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, user_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Simulate payment completion
    // In a real implementation, this would integrate with Stripe
    const now = new Date();
    const expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Update listing with payment info
    const { error: updateError } = await supabase
      .from('listings')
      .update({
        payment_status: 'paid',
        payment_expires_at: expiryDate.toISOString(),
        payment_amount: 5.00,
        payment_currency: 'EUR',
        payment_method: 'test',
        payment_reference: `TEST-${Date.now()}`,
        last_payment_date: now.toISOString(),
        active: true,
        updated_at: now.toISOString()
      })
      .eq('id', listingId);

    if (updateError) {
      console.error('Error updating listing:', updateError);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    // Create payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        amount: 5.00,
        currency: 'EUR',
        status: 'completed',
        payment_method: 'test',
        payment_reference: `TEST-${Date.now()}`,
        description: 'Test payment for listing',
        metadata: { test: true, simulated: true },
        completed_at: now.toISOString()
      });

    if (paymentError) {
      console.error('Error creating payment record:', paymentError);
      // Don't fail the request if payment record creation fails
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Payment simulated successfully',
      expiryDate: expiryDate.toISOString()
    });

  } catch (error) {
    console.error('Error in payment simulation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 