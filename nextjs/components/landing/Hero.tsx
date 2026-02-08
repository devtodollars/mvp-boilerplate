'use client';
import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import Glow from '@/components/ui/glow';
import { ArrowRightIcon } from 'lucide-react';

export const Hero = () => {
  return (
    <Section className="fade-bottom overflow-hidden pb-0 sm:pb-0 md:pb-0">
      <div className="max-w-container mx-auto flex flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          <h1 className="animate-appear from-foreground to-foreground dark:to-muted-foreground relative z-10 inline-block bg-linear-to-r bg-clip-text text-4xl leading-tight font-semibold text-balance text-transparent drop-shadow-2xl sm:text-6xl sm:leading-tight md:text-8xl md:leading-tight">
            Ship your MVP faster
          </h1>
          <p className="text-md animate-appear text-muted-foreground relative z-10 max-w-[740px] font-medium text-balance opacity-0 delay-100 sm:text-xl">
            Production-ready boilerplate with Next.js, Flutter, Supabase, and
            Stripe. Stop rebuilding auth, payments, and infrastructure.
          </p>
          <div className="animate-appear relative z-10 flex justify-center gap-4 opacity-0 delay-300">
            <Button size="lg" asChild>
              <a href="#pricing">
                Get Started
                <ArrowRightIcon className="ml-2 size-4" />
              </a>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
          <div className="relative w-full pt-12">
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-700"
            />
          </div>
        </div>
      </div>
    </Section>
  );
};
