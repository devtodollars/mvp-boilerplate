import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import EditListing from '@/components/EditListing';
import ProfileNotification from '@/components/misc/ProfileNotification';

// Force dynamic rendering since we need cookies
export const dynamic = 'force-dynamic';

interface EditListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const supabase = await createClient();
  const { id } = await params;

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
    .eq('id', id)
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
      <EditListing listing={listing} />
    </>
  );
} 