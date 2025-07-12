import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/landing/Navbar';
import { createClient } from '@/utils/supabase/server';
import { Search } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from '@/components/ui/input';

export default async function WelcomeCard() {
    const supabase = await createClient();
    const {
        data: { user }
    } = await supabase.auth.getUser();

    const { data: listings } = await supabase.from('listings').select('*');

    return (
        <>
            <Navbar user={user} />
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-[340px]">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Label htmlFor="search" className="sr-only">
                                Search
                            </Label>
                            <Input
                                id="search"
                                placeholder="County, City, Town or Area..."
                                className="pl-8"
                            />
                            <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
