import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    const supabase = await createClient();
    console.log('Supabase client created');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('listings')
      .select('id, property_name')
      .limit(1);
    
    if (testError) {
      console.error('Error testing listings table:', testError);
      return NextResponse.json({ 
        error: 'Database connection failed', 
        details: testError 
      }, { status: 500 });
    }
    
    console.log('Listings table accessible, sample data:', testData);
    
    // Test payments table
    const { data: paymentsData, error: paymentsError } = await supabase
      .from('payments')
      .select('id, listing_id, user_id, amount, status')
      .limit(1);
    
    if (paymentsError) {
      console.error('Error testing payments table:', paymentsError);
      return NextResponse.json({ 
        error: 'Payments table access failed', 
        details: paymentsError 
      }, { status: 500 });
    }
    
    console.log('Payments table accessible, sample data:', paymentsData);
    
    // Test inserting a payment record
    const testPayment = {
      listing_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      amount: 5.00,
      currency: 'EUR',
      status: 'pending',
      payment_method: 'test',
      description: 'Test payment',
      metadata: { test: true }
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('payments')
      .insert([testPayment])
      .select();
    
    if (insertError) {
      console.error('Error testing payment insert:', insertError);
      return NextResponse.json({ 
        error: 'Payment insert test failed', 
        details: insertError,
        testPayment
      }, { status: 500 });
    }
    
    console.log('Payment insert test successful:', insertData);
    
    // Clean up test data
    if (insertData && insertData[0]) {
      await supabase
        .from('payments')
        .delete()
        .eq('id', insertData[0].id);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection and table access working correctly',
      listingsSample: testData,
      paymentsSample: paymentsData,
      insertTest: 'Passed'
    });
    
  } catch (error) {
    console.error('Unexpected error in database test:', error);
    return NextResponse.json(
      { error: 'Database test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 