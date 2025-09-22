import { HomePageWrapper } from '@/components/HomePageWrapper';
import { getCachedUser } from '@/utils/supabase/serverAuth';

// Force dynamic rendering since we need cookies and search params
export const dynamic = 'force-dynamic';

export default async function LandingPage() {
  // Use cached user to prevent repeated auth calls
  const user = await getCachedUser();
  return <HomePageWrapper user={user} />;
}
