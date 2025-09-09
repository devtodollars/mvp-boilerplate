import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment creation API called');
    
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Get the request body
    const body = await request.json();
    console.log('Request body:', body);
    
    const { listingId, userId, amount, currency, description, metadata } = body;
    
    // Validate required fields
    if (!listingId || !userId || !amount || !currency) {
      console.error('Missing required fields:', { listingId, userId, amount, currency });
      return NextResponse.json(
        { error: 'Missing required fields', received: { listingId, userId, amount, currency } },
        { status: 400 }
      );
    }

    console.log('Attempting to create payment record with:', {
      listing_id: listingId,
      user_id: userId,
      amount: amount / 100,
      currency: currency.toUpperCase(),
      status: 'pending',
      payment_method: 'stripe',
      description: description || `Payment for listing ${listingId}`,
      metadata: metadata || {},
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    // Create payment record
    const { data: payment, error } = await supabase
      .from('payments')
      .insert([{
        listing_id: listingId,
        user_id: userId,
        amount: amount / 100, // Convert from cents to euros
        currency: currency.toUpperCase(),
        status: 'pending',
        payment_method: 'stripe',
        description: description || `Payment for listing ${listingId}`,
        metadata: metadata || {},
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      }])
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating payment record:', error);
      return NextResponse.json(
        { error: 'Failed to create payment record', details: error },
        { status: 500 }
      );
    }

    console.log('Payment record created successfully:', payment);

    return NextResponse.json({ 
      success: true, 
      id: payment.id,
      payment 
    });

  } catch (error) {
    console.error('Unexpected error in payment creation:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
