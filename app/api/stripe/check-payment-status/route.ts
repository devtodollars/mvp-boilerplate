import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const { sessionId, paymentId, listingId } = await request.json();
    
    if (!sessionId || !paymentId || !listingId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Checking payment status for session:', sessionId);

    // Retrieve the checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('Session found, payment status:', session.payment_status);

    // If payment was successful, update the database
    if (session.payment_status === 'paid') {
      const supabase = await createClient();
      
      console.log('Payment successful, updating database...');

      // Update payment status to completed
      const { error: paymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          stripe_payment_intent_id: session.payment_intent as string,
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

      console.log('Successfully activated listing:', listingId);

      return NextResponse.json({ 
        success: true, 
        payment_status: 'paid',
        message: 'Payment completed and listing activated'
      });
    } else {
      // Payment was not successful
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
