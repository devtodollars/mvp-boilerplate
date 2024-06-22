import AccountPage from '@/components/misc/AccountPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function Account() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/auth/signin');
  }

  return <AccountPage user={user} />;
}
