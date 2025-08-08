import { createClient } from '@/utils/supabase/server';
import ProfileNotification from '@/components/misc/ProfileNotification';
import SearchPageWrapper from '@/components/search/SearchPageWrapper';

export default async function SearchPage() {
    const supabase = await createClient();
    
    let user = null;
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
    } catch (error: any) {
        // Handle refresh token errors gracefully
        if (error?.code === 'refresh_token_not_found' || 
            error?.message?.includes('Invalid Refresh Token')) {
            console.log('No valid session found on search page');
            user = null;
        } else {
            console.error('Authentication error on search page:', error);
            user = null;
        }
    }

    return (
        <>
            <ProfileNotification />
            <SearchPageWrapper />
        </>
    );
}

