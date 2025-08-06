import { HomePageWrapper } from '@/components/HomePageWrapper';
import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();

  let user = null;
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    user = authUser;
  } catch (error: any) {
    // Handle refresh token errors gracefully
    if (error?.code === 'refresh_token_not_found' || 
        error?.message?.includes('Invalid Refresh Token')) {
      console.log('No valid session found on main page');
      user = null;
    } else {
      console.error('Authentication error on main page:', error);
      user = null;
    }
  }

  return <HomePageWrapper user={user} />;
}
