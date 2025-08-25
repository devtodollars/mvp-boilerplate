'use client';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { createApiClient } from '@/utils/supabase/api';
import ProfileCompletionDialog from '@/components/misc/ProfileCompletionDialog';
import { SearchFilters } from '@/components/search/AdvancedSearchFilters';
import { parseNaturalLanguageQuery } from '@/components/search/AISearchLogic';

export const Hero = ({ user }: { user: User | null }) => {
  const router = useRouter();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePostRoom = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setIsCheckingProfile(true);
    
    try {
      const supabase = createClient();
      const api = createApiClient(supabase);
      const { completed } = await api.checkProfileCompletion(user);
      
      if (completed) {
        router.push('/listroom');
      } else {
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
      // If there's an error, allow them to proceed to listroom page
      // where they'll be redirected to profile completion if needed
      router.push('/listroom');
    } finally {
      setIsCheckingProfile(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // Parse the natural language query into filters
      const filters = parseNaturalLanguageQuery(searchQuery);
      
      // Build the search URL with query parameters
      const params = new URLSearchParams();
      params.set('q', searchQuery);
      
      // Add filter parameters
      if (filters.county) params.set('county', filters.county);
      if (filters.propertyType) params.set('propertyType', filters.propertyType);
      if (filters.roomType) params.set('roomType', filters.roomType);
      if (filters.minPrice) params.set('minPrice', filters.minPrice.toString());
      if (filters.maxPrice) params.set('maxPrice', filters.maxPrice.toString());
      if (filters.pets) params.set('pets', 'true');
      if (filters.ensuite) params.set('ensuite', 'true');
      if (filters.verifiedOnly) params.set('verifiedOnly', 'true');
      
      // Navigate to search page with parameters
      const searchUrl = `/search?${params.toString()}`;
      router.push(searchUrl);
    } else {
      // If no search query, just go to search page
      router.push('/search');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <section
      className="
        container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10
        lg:bg-[url('/hero-bg.png')] lg:bg-contain lg:bg-no-repeat lg:bg-center
      "
    >
      <div className="flex flex-col items-center text-center space-y-6 lg:items-start lg:text-start">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            The Only {' '}
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              Safe
            </span>{' '}
          </h1>
          <h2 className="inline">
          way to rent in Ireland!
            </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
        We can't fix the housing crisis, but we can make renting safer. Ireland's first rental platform with Scam and Deposit protection, in-app messaging, tenant profiles, and a fair queueing system.
        </p>

        <div className="flex flex-col w-full max-w-lg gap-2 md:flex-row md:items-center md:justify-start">
          {/* Search bar */}
          <div className="w-full">
            <Input 
              type="text" 
              placeholder="room, address, etc." 
              className="w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          {/* Buttons row */}
          <div className="flex flex-row w-full gap-2 justify-center md:w-auto md:justify-start">
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              variant="default"
              className="w-full md:w-auto"
              onClick={handlePostRoom}
              disabled={isCheckingProfile}
            >
              {isCheckingProfile ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Checking...
                </>
              ) : (
                'Post a Room'
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Hero cards sections */}
      {/* <div className="z-10">
        <HeroCards />
      </div> */}

      {/* Shadow effect */}
      <div className="shadow"></div>
      
      {/* Profile Completion Dialog */}
      <ProfileCompletionDialog
        isOpen={showProfileDialog}
        onClose={() => setShowProfileDialog(false)}
        user={user}
      />
    </section>
  );
};
