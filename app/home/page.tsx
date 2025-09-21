import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/landing/Navbar';
import { createClient } from '@/utils/supabase/server';
import ProfileNotification from '@/components/misc/ProfileNotification';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import { SearchFilters } from '@/components/search/AdvancedSearchFilters';
import HomeSearchWrapper from '@/components/HomeSearchWrapper';

export default async function WelcomeCard() {
    const supabase = await createClient();
    
    // Skip auth check for now to reduce requests
    // The client-side AuthProvider will handle user state
    const user = null;

    const { data: listings } = await supabase
        .from('listings')
        .select('*')
        .eq('active', true)
        .eq('payment_status', 'paid')
        .gt('payment_expires_at', new Date().toISOString());

    return (
        <>
            <ProfileNotification />
            <div className="flex justify-center items-center min-h-screen">
                <Card className="w-[500px] max-w-[90vw]">
                    <CardContent className="p-6">
                        <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold mb-2">Find Your Perfect Home</h1>
                            <p className="text-muted-foreground">
                                Search with natural language - just describe what you're looking for
                            </p>
                        </div>
                        
                        <HomeSearchWrapper />
                        
                        <div className="mt-4 text-xs text-muted-foreground text-center">
                            <p>💡 Try searching with natural language like:</p>
                            <p>"ensuite room with parking" • "cheap apartment in Cork" • "pet friendly under €800"</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
