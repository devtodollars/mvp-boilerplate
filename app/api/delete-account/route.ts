import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getApiUser } from '@/utils/supabase/serverApiAuth';
import { extractFilePathFromUrl, deleteStorageFiles } from '@/utils/supabase/storage';

export async function DELETE(request: NextRequest) {
  try {
    console.log('Delete account API called');
    
    const supabase = await createClient();
    
    // Get the current user with caching
    const { user, error: userError } = await getApiUser(request);
    
    if (userError || !user) {
      console.error('User authentication error:', userError);
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    console.log('User authenticated:', user.id);

    // Step 1: Check for active listings BEFORE any deletion
    console.log('Checking for active listings...');
    const { data: activeListings, error: activeListingsError } = await supabase
      .from('listings')
      .select('id, property_name, active')
      .eq('user_id', user.id)
      .eq('active', true);

    if (activeListingsError) {
      console.error('Error checking active listings:', activeListingsError);
      return NextResponse.json(
        { error: 'Failed to check active listings' },
        { status: 500 }
      );
    }

    if (activeListings && activeListings.length > 0) {
      console.log(`User has ${activeListings.length} active listings - blocking deletion`);
      return NextResponse.json(
        { 
          error: 'Cannot delete account with active listings',
          activeListings: activeListings.map(l => ({ id: l.id, name: l.property_name })),
          message: 'Please deactivate or delete all your active property listings before deleting your account.'
        },
        { status: 400 }
      );
    }

    console.log('No active listings found - proceeding with account deletion');

    // Create admin client for admin operations
    const adminClient = createAdminClient();
    console.log('Admin client created');

    // Step 2: Get all user's listings to extract image paths
    console.log('Fetching user listings for image cleanup...');
    const { data: userListings, error: listingsError } = await supabase
      .from('listings')
      .select('id, images, videos')
      .eq('user_id', user.id);

    if (listingsError) {
      console.error('Error fetching user listings:', listingsError);
      // Continue with deletion even if we can't fetch listings
    } else {
      console.log(`Found ${userListings?.length || 0} listings to clean up`);
      
      // Step 3: Delete all images and videos from storage buckets
      if (userListings && userListings.length > 0) {
        const imagePaths: string[] = [];
        const videoPaths: string[] = [];

        // Extract file paths from listings
        userListings.forEach(listing => {
          if (listing.images && Array.isArray(listing.images)) {
            listing.images.forEach((imageUrl: any) => {
              if (typeof imageUrl === 'string') {
                const fileInfo = extractFilePathFromUrl(imageUrl);
                if (fileInfo && fileInfo.bucket === 'listing-images') {
                  imagePaths.push(fileInfo.path);
                }
              }
            });
          }
          
          if (listing.videos && Array.isArray(listing.videos)) {
            listing.videos.forEach((videoUrl: any) => {
              if (typeof videoUrl === 'string') {
                const fileInfo = extractFilePathFromUrl(videoUrl);
                if (fileInfo && fileInfo.bucket === 'listing-videos') {
                  videoPaths.push(fileInfo.path);
                }
              }
            });
          }
        });

        console.log(`Found ${imagePaths.length} images and ${videoPaths.length} videos to delete`);

        // Delete images from listing-images bucket
        if (imagePaths.length > 0) {
          const imageResult = await deleteStorageFiles(imagePaths, 'listing-images');
          if (imageResult.success) {
            console.log(`Successfully deleted ${imagePaths.length} images`);
          } else {
            console.error('Error deleting images:', imageResult.error);
          }
        }

        // Delete videos from listing-videos bucket
        if (videoPaths.length > 0) {
          const videoResult = await deleteStorageFiles(videoPaths, 'listing-videos');
          if (videoResult.success) {
            console.log(`Successfully deleted ${videoPaths.length} videos`);
          } else {
            console.error('Error deleting videos:', videoResult.error);
          }
        }
      }
    }

    // Step 4: Delete user profile from database
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

    // Step 5: Delete auth user
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
              message: 'Profile and media deleted successfully. Please contact support to complete account deletion.',
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
            message: 'Profile and media deleted successfully. Please contact support to complete account deletion.',
            warning: 'Auth account deletion failed - contact support'
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { success: true, message: 'Account and all associated data deleted successfully' },
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