'use client';

import { Button } from '@/components/ui/button';
import { Section } from '@/components/ui/section';
import Glow from '@/components/ui/glow';

export const Cta = () => {
  return (
    <Section id="cta" className="group relative overflow-hidden">
      <div className="max-w-container relative z-10 mx-auto flex flex-col items-center gap-6 text-center sm:gap-8">
        <h2 className="max-w-[640px] text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          Ready to launch your product?
        </h2>
        <div className="flex justify-center gap-4">
          <Button size="lg" asChild>
            <a href="#pricing">Get Started</a>
          </Button>
        </div>
      </div>
      <div className="absolute top-0 left-0 h-full w-full translate-y-[1rem] opacity-80 transition-all duration-500 ease-in-out group-hover:translate-y-[-2rem] group-hover:opacity-100">
        <Glow variant="bottom" />
      </div>
    </Section>
  );
};
