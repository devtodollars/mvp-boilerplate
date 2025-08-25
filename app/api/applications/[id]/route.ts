import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { getApiUser } from '@/utils/supabase/serverApiAuth';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { status, notes } = await request.json();
    const { id: applicationId } = await params;

    // Get the current user with caching
    const { user, error: userError } = await getApiUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the application to check permissions
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('*, listing:listings(user_id)')
      .eq('id', applicationId)
      .single();

    if (applicationError) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if user can update this application
    const canUpdate = 
      application.user_id === user.id || // User owns the application
      application.listing.user_id === user.id; // User owns the listing

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only update your own applications or applications for your listings' },
        { status: 403 }
      );
    }

    // Update application status
    const { data, error } = await supabase.rpc('update_application_status', {
      application_uuid: applicationId,
      new_status: status,
      review_notes: notes || null
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updated: data
    });

  } catch (error) {
    console.error('Update application error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: applicationId } = await params;

    // Get the current user with caching
    const { user, error: userError } = await getApiUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get the application to check permissions
    const { data: application, error: applicationError } = await supabase
      .from('applications')
      .select('user_id, listing_id')
      .eq('id', applicationId)
      .single();

    if (applicationError) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Only the application owner can delete their application
    if (application.user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: You can only delete your own applications' },
        { status: 403 }
      );
    }

    // Delete the application
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', applicationId);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Reorder the queue after deletion
    await supabase.rpc('reorder_application_queue', {
      listing_uuid: application.listing_id
    });

    return NextResponse.json({
      success: true,
      message: 'Application deleted successfully'
    });

  } catch (error) {
    console.error('Delete application error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 