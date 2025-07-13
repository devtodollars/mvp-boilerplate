
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getSubscription, getUser } from '@/utils/supabase/queries';
import ListARoom from '@/components/ListARoom';

export default async function ListRoom() {
    const supabase: any = await createClient();

    const [user, subscription] = await Promise.all([
        getUser(supabase),
        getSubscription(supabase)
    ]);

    // If user is not found, redirect to sign in
    if (!user) {
        return redirect('/auth/signin');
    }

    return <ListARoom />;
}
