import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getApiUser } from '@/utils/supabase/serverApiAuth';
import { createAdminClient } from '@/utils/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    
    // Get the current user with caching
    const { user, error: userError } = await getApiUser(request);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    const listingId = '6c6d453c-45fd-477f-9dc1-1be4e9dc9d81';
    const notes = 'Test application';

    console.log('Testing with:', { listingId, userId: user.id, notes });

    // Test 1: Direct INSERT with admin client
    const { data: insertData, error: insertError } = await adminClient
      .from('applications')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        position: 1,
        notes: notes,
        status: 'pending'
      })
      .select('id')
      .single();

    console.log('Direct INSERT result:', { insertData, insertError });

    // Test 2: Function call with admin client
    const { data: functionData, error: functionError } = await adminClient.rpc('add_application_to_queue', {
      listing_uuid: listingId,
      user_uuid: user.id,
      application_notes: notes
    });

    console.log('Function call result:', { functionData, functionError });

    // Test 3: Check what applications exist
    const { data: applications, error: appsError } = await adminClient
      .from('applications')
      .select('*')
      .eq('listing_id', listingId);

    console.log('Applications check:', { applications, appsError });

    return NextResponse.json({
      user: { id: user.id },
      direct_insert: {
        success: !insertError,
        data: insertData,
        error: insertError ? {
          message: insertError.message,
          code: insertError.code,
          details: insertError.details
        } : null
      },
      function_call: {
        success: !functionError,
        data: functionData,
        error: functionError ? {
          message: functionError.message,
          code: functionError.code,
          details: functionError.details
        } : null
      },
      applications: {
        count: applications?.length || 0,
        data: applications || [],
        error: appsError?.message
      }
    });

  } catch (error) {
    console.error('Error in test apply endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 