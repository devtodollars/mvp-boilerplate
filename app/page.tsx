import { HomePageWrapper } from '@/components/HomePageWrapper';
import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return <HomePageWrapper user={user} />;
}
