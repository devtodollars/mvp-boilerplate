import AccountPage from '@/components/misc/AccountPage';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import {
  getSubscription,
  getUser,
  getXmrInvoices
} from '@/utils/supabase/queries';

export default async function Account() {
  const supabase = await createClient();
  const [user, subscription, xmrInvoices] = await Promise.all([
    getUser(supabase),
    getSubscription(supabase),
    getXmrInvoices(supabase)
  ]);

  if (!user) {
    return redirect('/auth/signin');
  }

  return (
    <AccountPage
      user={user}
      subscription={subscription}
      xmrInvoices={xmrInvoices}
    />
  );
}
