import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    console.log('Delete account API called');
    
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Create admin client for admin operations
    const adminClient = createAdminClient();
    console.log('Admin client created');

    // Delete user profile from database first
    console.log('Deleting user profile for user ID:', user.id);
    
    // Try with regular client first
    let { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('id', user.id);

    // If regular client fails, try with admin client
    if (profileError) {
      console.error('Regular client profile delete failed:', profileError);
      console.log('Trying with admin client...');
      
      const { error: adminProfileError } = await adminClient
        .from('users')
        .delete()
        .eq('id', user.id);
        
      if (adminProfileError) {
        console.error('Admin client profile delete failed:', adminProfileError);
        return NextResponse.json(
          { error: `Failed to delete user profile: ${adminProfileError.message}` },
          { status: 500 }
        );
      } else {
        console.log('User profile deleted successfully via admin client');
      }
    } else {
      console.log('User profile deleted successfully via regular client');
    }

    // Try to delete auth user using admin privileges
    console.log('Attempting to delete auth user...');
    let authDeleted = false;
    
    try {
      const { error: authError } = await adminClient.auth.admin.deleteUser(user.id);
      
      if (authError) {
        console.error('Admin delete failed:', authError);
        // Continue with fallback approach
      } else {
        console.log('Auth user deleted successfully via admin client');
        authDeleted = true;
      }
    } catch (adminError) {
      console.error('Admin client error:', adminError);
      // Continue with fallback approach
    }

    // Fallback: Use direct SQL if admin client fails
    if (!authDeleted) {
      console.log('Trying SQL fallback for auth deletion...');
      try {
        const { error: sqlError } = await supabase.rpc('delete_auth_user', {
          user_id: user.id
        });
        
        if (sqlError) {
          console.error('SQL delete failed:', sqlError);
          // Profile is deleted, but auth deletion failed
          return NextResponse.json(
            { 
              success: true, 
              message: 'Profile deleted successfully. Please contact support to complete account deletion.',
              warning: 'Auth account deletion failed - contact support'
            },
            { status: 200 }
          );
        } else {
          console.log('Auth user deleted successfully via SQL');
          authDeleted = true;
        }
      } catch (sqlError) {
        console.error('SQL execution error:', sqlError);
        // Profile is deleted, but auth deletion failed
        return NextResponse.json(
          { 
            success: true, 
            message: 'Profile deleted successfully. Please contact support to complete account deletion.',
            warning: 'Auth account deletion failed - contact support'
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Account deleted successfully' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 