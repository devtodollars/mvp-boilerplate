import { HomePageWrapper } from '@/components/HomePageWrapper';
import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  // Only check auth if we need user data for the home page
  // For now, let's skip the auth check on the landing page to reduce requests
  const user = null;

  return <HomePageWrapper user={user} />;
}
