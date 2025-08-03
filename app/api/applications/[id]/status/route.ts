import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();
    
    if (!status || !['accepted', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get the application to verify ownership
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        listing:listings(user_id)
      `)
      .eq('id', params.id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify that the user owns the listing
    if (application.listing.user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update the application status
    const { error: updateError } = await supabase
      .from('applications')
      .update({ 
        status,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Error updating application:', updateError);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // If accepting, you might want to reject all other pending applications
    if (status === 'accepted') {
      const { error: rejectOthersError } = await supabase
        .from('applications')
        .update({ 
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('listing_id', application.listing_id)
        .eq('status', 'pending')
        .neq('id', params.id);

      if (rejectOthersError) {
        console.error('Error rejecting other applications:', rejectOthersError);
        // Don't fail the request if this fails
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Application ${status} successfully` 
    });

  } catch (error) {
    console.error('Error in application status update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 