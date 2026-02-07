'use client';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button';
import { HeroCards } from './HeroCards';
import { Shield, Lock } from 'lucide-react';

export const Hero = () => {
  return (
    <section className="container grid lg:grid-cols-2 place-items-center py-20 md:py-32 gap-10">
      <div className="text-center lg:text-start space-y-6">
        <main className="text-5xl md:text-6xl font-bold">
          <h1 className="inline">
            <span className="inline bg-linear-to-r from-[#10B981] to-[#059669] text-transparent bg-clip-text">
              Shadcn
            </span>{' '}
            landing page
          </h1>{' '}
          for{' '}
          <h2 className="inline">
            <span className="inline bg-linear-to-r from-[#06B6D4] via-[#0891B2] to-[#0E7490] text-transparent bg-clip-text">
              React
            </span>{' '}
            developers
          </h2>
        </main>

        <p className="text-xl text-muted-foreground md:w-10/12 mx-auto lg:mx-0">
          Build your React landing page effortlessly with the required sections
          to your project.
        </p>

        <div className="space-y-4 md:space-y-0 md:space-x-4">
          <Button className="w-full md:w-1/3">
            <Shield className="mr-2 w-5 h-5" />
            Get Started
          </Button>

          <a
            href="#howItWorks"
            className={`w-full md:w-1/3 ${buttonVariants({
              variant: 'outline'
            })}`}
          >
            Learn More
            <Lock className="ml-2 w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Hero cards sections */}
      <div className="z-10">
        <HeroCards />
      </div>

      {/* Shadow effect */}
      <div className="shadow-sm"></div>
    </section>
  );
};
