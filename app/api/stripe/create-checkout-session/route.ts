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

    // Validate returnUrl format
    try {
      new URL(returnUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid returnUrl format' },
        { status: 400 }
      );
    }

    // Construct URLs properly - Stripe is very strict about URL format
    const baseUrl = returnUrl.split('?')[0]; // Remove existing query params
    
    // Ensure the base URL is valid and doesn't have trailing slashes
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    
    // Construct URLs with proper encoding
    const successUrl = `${cleanBaseUrl}?payment=success&payment_id=${encodeURIComponent(paymentId)}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${cleanBaseUrl}?payment=cancelled`;
    
    console.log('Constructed URLs:', { 
      originalReturnUrl: returnUrl,
      baseUrl: baseUrl,
      cleanBaseUrl: cleanBaseUrl,
      successUrl: successUrl, 
      cancelUrl: cancelUrl 
    });
    
    // Validate the constructed URLs
    try {
      new URL(successUrl.replace('{CHECKOUT_SESSION_ID}', 'test_session_id'));
      new URL(cancelUrl);
      console.log('URL validation passed');
    } catch (urlError) {
      console.error('URL validation failed:', urlError);
      return NextResponse.json(
        { 
          error: 'Invalid URL construction',
          details: 'Failed to construct valid URLs for Stripe checkout',
          urlError: urlError instanceof Error ? urlError.message : 'Unknown URL error'
        },
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
      success_url: successUrl,
      cancel_url: cancelUrl,
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
    
    // Handle specific Stripe errors
    if (error instanceof Error) {
      if (error.message.includes('string did not match the expected pattern')) {
        return NextResponse.json(
          { 
            error: 'Invalid URL format for Stripe checkout',
            details: 'The return URL format is not compatible with Stripe. Please try again.',
            originalError: error.message
          },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        details: error instanceof Error ? error.message : 'Unknown error',
        type: error instanceof Error ? error.constructor.name : 'Unknown'
      },
      { status: 500 }
    );
  }
}
