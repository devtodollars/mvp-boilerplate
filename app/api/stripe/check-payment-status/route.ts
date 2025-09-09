import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== PAYMENT STATUS CHECK API CALLED ===');
    const { sessionId, paymentId, listingId } = await request.json();
    console.log('Request data:', { sessionId, paymentId, listingId });
    
    if (!sessionId || !paymentId) {
      console.error('Missing required fields:', { sessionId, paymentId });
      return NextResponse.json(
        { error: 'Missing required fields: sessionId and paymentId are required' },
        { status: 400 }
      );
    }

    // If listingId is not provided, we'll get it from the payment record
    let finalListingId = listingId;
    
    if (!finalListingId) {
      console.log('Listing ID not provided, fetching from payment record...');
      const supabase = await createClient();
      const { data: payment, error: paymentFetchError } = await supabase
        .from('payments')
        .select('listing_id')
        .eq('id', paymentId)
        .single();

      if (paymentFetchError) {
        console.error('Error fetching payment record:', paymentFetchError);
        return NextResponse.json(
          { error: 'Could not fetch payment record', details: paymentFetchError },
          { status: 500 }
        );
      }

      if (!payment?.listing_id) {
        console.error('No listing_id found in payment record:', payment);
        return NextResponse.json(
          { error: 'Could not find listing for payment' },
          { status: 404 }
        );
      }
      
      finalListingId = payment.listing_id;
      console.log('Found listing ID from payment record:', finalListingId);
    }

    console.log('Checking payment status for session:', sessionId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      console.error('Session not found in Stripe');
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('Session found, payment status:', session.payment_status);
    console.log('Session details:', {
      id: session.id,
      payment_status: session.payment_status,
      payment_intent: session.payment_intent,
      amount_total: session.amount_total,
      currency: session.currency
    });

    // If payment was successful, update the database
    if (session.payment_status === 'paid') {
      console.log('Payment successful, updating database...');
      const supabase = await createClient();
      
      // Update payment status to completed
      console.log('Updating payment record with ID:', paymentId);
      const { data: paymentUpdateData, error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select();

      if (paymentError) {
        console.error('Error updating payment status:', paymentError);
        return NextResponse.json(
          { error: 'Failed to update payment status', details: paymentError },
          { status: 500 }
        );
      }

      console.log('Payment record updated successfully:', paymentUpdateData);

      // Update listing to active and set payment expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now
      
      console.log('Setting payment expiry to:', expiryDate.toISOString());
      console.log('Updating listing with ID:', finalListingId);

      const { data: listingUpdateData, error: listingError } = await supabase
        .from('listings')
        .update({
          active: true,
          payment_status: 'paid',
          payment_expires_at: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', finalListingId)
        .select();

      if (listingError) {
        console.error('Error updating listing status:', listingError);
        return NextResponse.json(
          { error: 'Failed to update listing status', details: listingError },
          { status: 500 }
        );
      }

      console.log('Listing updated successfully:', listingUpdateData);
      console.log('Successfully activated listing:', finalListingId);

      return NextResponse.json({ 
        success: true, 
        payment_status: 'paid',
        message: 'Payment completed and listing activated',
        updated_payment: paymentUpdateData,
        updated_listing: listingUpdateData
      });
    } else {
      // Payment was not successful
      console.log('Payment was not successful, status:', session.payment_status);
      return NextResponse.json({ 
        success: false, 
        payment_status: session.payment_status,
        message: 'Payment was not completed'
      });
    }

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
