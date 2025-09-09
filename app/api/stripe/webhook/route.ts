import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    console.log('Webhook received, body length:', body.length);
    console.log('Stripe signature header:', sig ? 'Present' : 'Missing');

    let event: Stripe.Event;

    // Try to verify the webhook signature if secret is available
    if (process.env.STRIPE_WEBHOOK_SECRET && sig) {
      try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        console.log('Webhook signature verified successfully');
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
      }
    } else {
      // If no webhook secret, just parse the body (for development)
      console.warn('No webhook secret configured, skipping signature verification');
      event = JSON.parse(body);
    }

    console.log('Processing webhook event:', event.type, 'ID:', event.id);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Processing completed checkout session:', session.id);
        console.log('Payment status:', session.payment_status);
        console.log('Session metadata:', session.metadata);
        
        if (session.payment_status === 'paid') {
          await handleSuccessfulPayment(session);
        } else {
          console.log('Payment not completed, status:', session.payment_status);
        }
        break;
      
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        break;
      
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        await handleFailedPayment(failedPayment);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true, event_type: event.type });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  try {
    console.log('Handling successful payment for session:', session.id);
    const supabase = await createClient();
    
    const { listing_id, payment_id } = session.metadata || {};
    
    if (!listing_id || !payment_id) {
      console.error('Missing metadata in session:', session.metadata);
      return;
    }

    console.log('Updating payment record:', payment_id);
    
    // Update payment status to completed
    const { error: paymentError } = await supabase
      .from('payments')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment_id);

    if (paymentError) {
      console.error('Error updating payment status:', paymentError);
      return;
    }

    console.log('Payment record updated successfully');

    // Update listing to active and set payment expiry
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 30); // 30 days from now

    console.log('Updating listing:', listing_id, 'to active with expiry:', expiryDate);

    const { error: listingError } = await supabase
      .from('listings')
      .update({
        active: true,
        payment_status: 'paid',
        payment_expires_at: expiryDate.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', listing_id);

    if (listingError) {
      console.error('Error updating listing status:', listingError);
      return;
    }

    console.log(`Successfully activated listing ${listing_id} with payment ${payment_id}`);
    
  } catch (error) {
    console.error('Error handling successful payment:', error);
  }
}

async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Handling failed payment:', paymentIntent.id);
    const supabase = await createClient();
    
    // Find the payment record by stripe_payment_intent_id
    const { data: payments, error: findError } = await supabase
      .from('payments')
      .select('id, listing_id')
      .eq('stripe_payment_intent_id', paymentIntent.id);

    if (findError || !payments || payments.length === 0) {
      console.error('Could not find payment record for failed payment intent');
      return;
    }

    const payment = payments[0];
    
    // Update payment status to failed
    await supabase
      .from('payments')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id);

    // Ensure listing is not active
    if (payment.listing_id) {
      await supabase
        .from('listings')
        .update({
          active: false,
          payment_status: 'unpaid',
          updated_at: new Date().toISOString()
        })
        .eq('id', payment.listing_id);

      console.log(`Payment ${payment.id} marked as failed, listing ${payment.listing_id} deactivated`);
    }
    
  } catch (error) {
    console.error('Error handling failed payment:', error);
  }
}
