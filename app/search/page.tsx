import { createClient } from '@/utils/supabase/server';
import ProfileNotification from '@/components/misc/ProfileNotification';
import SearchPageWrapper from '@/components/search/SearchPageWrapper';
import { getCachedUser } from '@/utils/supabase/serverAuth';

export default async function SearchPage() {
    const supabase = await createClient();
    
    // Use cached user to prevent repeated auth calls
    const user = await getCachedUser();

    return (
        <>
            <ProfileNotification />
            <SearchPageWrapper />
        </>
    );
}

