import { createClient } from '@/utils/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import ChatRoom from '@/components/ChatRoom';
import ProfileNotification from '@/components/misc/ProfileNotification';

interface ChatPageProps {
  params: {
    applicationId: string;
  };
}

export default async function ChatPage({ params }: ChatPageProps) {
  const supabase = await createClient();
  const { applicationId } = params;

  // Get current user
  const user = await getUser(supabase);

  // If user is not found, redirect to sign in
  if (!user) {
    return redirect('/auth/signin');
  }

  // Fetch the application to verify access and get details
  const { data: application, error } = await supabase
    .from('applications')
    .select(`
      *,
      listing:listings(property_name, user_id),
      user:users(full_name, first_name, last_name)
    `)
    .eq('id', applicationId)
    .single();

  // If application doesn't exist, show 404
  if (error || !application) {
    notFound();
  }

  // Verify user has access to this application (either as applicant or property owner)
  if (application.user_id !== user.id && application.listing.user_id !== user.id) {
    return redirect('/dashboard');
  }

  // Only allow chat for accepted applications
  if (application.status !== 'accepted') {
    return redirect('/dashboard');
  }

  // Determine the other party's name
  const isApplicant = application.user_id === user.id;
  const otherPartyName = isApplicant 
    ? application.listing.property_name // If user is applicant, show property name
    : (application.user.full_name || `${application.user.first_name} ${application.user.last_name}`.trim() || 'Applicant'); // If user is owner, show applicant name

  const listingName = application.listing.property_name;

  return (
    <>
      <ProfileNotification />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 py-8">
        <div className="container mx-auto px-4">
          <ChatRoom
            applicationId={applicationId}
            listingName={listingName}
            applicantName={otherPartyName}
            onClose={() => window.history.back()}
          />
        </div>
      </div>
    </>
  );
} 