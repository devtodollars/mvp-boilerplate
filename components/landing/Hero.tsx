'use client';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { HeroCards } from './HeroCards';
import { GitHubLogoIcon } from '@radix-ui/react-icons';
import { Input } from "@/components/ui/input"


export const Hero = () => {
  return (
    <section
      className="
        container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10
        lg:bg-[url('/hero-bg.png')] lg:bg-contain lg:bg-no-repeat lg:bg-center
      "
    >
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
              GoLet.ie
            </span>{' '}
          </h1>
          <h2 className="inline">
          A Better Way to Rent!
            </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
        We can't fix the housing crisis, but we can make renting safer. Ireland's first rental platform with Scam and Deposit protection, in-app messaging, tenant profiles, and a fair queueing system.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
      
          <div className="flex w-full max-w-lg items-center gap-2 justify-center lg:justify-start">
            <Input type="text" placeholder="room, address, etc." />
            <Button type="submit" variant="outline">
              Search
            </Button>
            <Button variant="default">Post a Room</Button>
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
