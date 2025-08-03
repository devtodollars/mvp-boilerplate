import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import ApplicationManagement from '@/components/ApplicationManagement';
import ProfileNotification from '@/components/misc/ProfileNotification';

interface ApplicationManagementPageProps {
  params: {
    listingId: string;
  };
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
  if (listing.user_id !== user.id) {
    return redirect('/dashboard');
  }

  return (
    <>
      <ProfileNotification />
      <ApplicationManagement listing={listing} />
    </>
  );
} 