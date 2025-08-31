import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
});

export async function POST(request: NextRequest) {
  try {
    const { listingId, paymentId, returnUrl } = await request.json();
    
    // Validate required fields
    if (!listingId || !paymentId || !returnUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: 'Room Listing Fee',
              description: '30-day listing activation for your property',
            },
            unit_amount: 500, // €5.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}&payment=success&payment_id=${paymentId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}&payment=cancelled`,
      metadata: {
        listing_id: listingId,
        payment_id: paymentId,
        payment_type: 'room_listing_fee'
      },
      expires_at: Math.floor(Date.now() / 1000) + (30 * 60), // 30 minutes from now
    });

    return NextResponse.json({ 
      success: true, 
      checkoutUrl: session.url 
    });

  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
