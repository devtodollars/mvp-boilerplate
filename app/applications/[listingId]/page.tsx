import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import ApplicationManagement from '@/components/ApplicationManagement';
import ProfileNotification from '@/components/misc/ProfileNotification';

// Force dynamic rendering since we need cookies
export const dynamic = 'force-dynamic';

interface ApplicationManagementPageProps {
  params: Promise<{
    listingId: string;
  }>;
}

export default async function ApplicationManagementPage({ params }: ApplicationManagementPageProps) {
  const supabase = await createClient();
  const { listingId } = await params;

  // Get current user
  const user = await getUser(supabase);

  // If user is not found, redirect to sign in
  if (!user) {
    return redirect('/auth/signin');
  }

  // Fetch the listing to verify ownership
  const { data: listing, error } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .single();

  // If listing doesn't exist, show 404
  if (error || !listing) {
    notFound();
  }

  // If user doesn't own the listing, redirect to dashboard
  if (!listing.user_id || listing.user_id !== user.id) {
    return redirect('/dashboard');
  }

  // Ensure user_id is not null for the component
  const listingWithUserId = {
    ...listing,
    user_id: listing.user_id as string
  };

  return (
    <>
      <ProfileNotification />
      <ApplicationManagement listing={listingWithUserId} />
    </>
  );
} 