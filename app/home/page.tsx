import { Card, CardContent } from '@/components/ui/card';
import { Navbar } from '@/components/landing/Navbar';
import { createClient } from '@/utils/supabase/server';
import ProfileNotification from '@/components/misc/ProfileNotification';
import EnhancedSearchBar from '@/components/search/EnhancedSearchBar';
import { SearchFilters } from '@/components/search/AdvancedSearchFilters';
import { useRouter } from 'next/navigation';

export default async function WelcomeCard() {
    const supabase = await createClient();
    
    let user = null;
    try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        user = authUser;
    } catch (error: any) {
        // Handle refresh token errors gracefully
        if (error?.code === 'refresh_token_not_found' || 
            error?.message?.includes('Invalid Refresh Token')) {
            console.log('No valid session found on home page');
            user = null;
        } else {
            console.error('Authentication error on home page:', error);
            user = null;
        }
    }

    const { data: listings } = await supabase.from('listings').select('*');

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
                        
                        <EnhancedSearchBar 
                            onSearch={(query, filters) => {
                                // This will be handled by the client component
                                console.log('Search:', query, filters)
                            }}
                            placeholder="e.g., 'cheap apartment in Dublin' or 'pet friendly under €1000'"
                            className="w-full"
                        />
                        
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
