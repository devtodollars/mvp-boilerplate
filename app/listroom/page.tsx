
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';
import ListARoom from '@/components/ListARoom';
import ProfileNotification from '@/components/misc/ProfileNotification';

// Force dynamic rendering since we need cookies
export const dynamic = 'force-dynamic';

export default async function ListRoom() {
    const supabase: any = await createClient();

    const user = await getUser(supabase);

    // If user is not found, redirect to sign in
    if (!user) {
        return redirect('/auth/signin');
    }

    return (
        <>
            <ProfileNotification />
            <ListARoom />
        </>
    );
}
