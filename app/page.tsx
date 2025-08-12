import { HomePageWrapper } from '@/components/HomePageWrapper';
import { getCachedUser } from '@/utils/supabase/serverAuth';

export default async function LandingPage() {
  // Use cached user to prevent repeated auth calls
  const user = await getCachedUser();
  return <HomePageWrapper user={user} />;
}
