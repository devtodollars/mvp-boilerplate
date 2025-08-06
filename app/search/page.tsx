import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/landing/Navbar';
import { createClient } from '@/utils/supabase/server';
import { Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';
import SearchComponent from '@/components/search/searchComponent';
import { Footer } from '@/components/landing/Footer';
import ProfileNotification from '@/components/misc/ProfileNotification';

export default async function WelcomeCard() {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    const { data: listings } = await supabase.from('listings').select('*');

    return (
        <>
            <ProfileNotification />
            <SearchComponent />
        </>
    );
}

