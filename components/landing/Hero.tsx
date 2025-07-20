'use client';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

export const Hero = ({ user }: { user: User | null }) => {
  const router = useRouter();

  const handlePostRoom = () => {
    if (user) {
      router.push('/listroom');
    } else {
      router.push('/auth');
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
            <Input type="text" placeholder="room, address, etc." className="w-full" />
          </div>
          {/* Buttons row */}
          <div className="flex flex-row w-full gap-2 justify-center md:w-auto md:justify-start">
            <Button
              type="button"
              variant="outline"
              className="w-full md:w-auto"
              onClick={() => router.push('/search')}
            >
              Search
            </Button>
            <Button
              variant="default"
              className="w-full md:w-auto"
              onClick={handlePostRoom}
            >
              Post a Room
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
    </section>
  );
};
