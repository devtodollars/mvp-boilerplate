import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Manual payment completion API called');
    
    const supabase = await createClient();
    
    // Get the request body
    const { paymentId, listingId } = await request.json();
    
    if (!paymentId || !listingId) {
      return NextResponse.json(
        { error: 'Missing paymentId or listingId' },
        { status: 400 }
      );
    }

    console.log('Completing payment:', paymentId, 'for listing:', listingId);

    // Update payment status to completed
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
      return NextResponse.json(
        { error: 'Failed to update payment status', details: paymentError },
        { status: 500 }
      );
    }

    // Update listing to active and set payment expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    const { error: listingError } = await supabase
      .from('listings')
      .update({
        active: true,
        payment_status: 'paid',
        payment_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (listingError) {
      console.error('Error updating listing status:', listingError);
      return NextResponse.json(
        { error: 'Failed to update listing status', details: listingError },
        { status: 500 }
      );
    }

    console.log('Payment completed successfully for listing:', listingId);

    return NextResponse.json({ 
      success: true, 
      message: 'Payment completed and listing activated'
    });

  } catch (error) {
    console.error('Error in manual payment completion:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
