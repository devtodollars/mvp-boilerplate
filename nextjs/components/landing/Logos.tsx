'use client';

import {
  SiNextdotjs,
  SiSupabase,
  SiStripe,
  SiFlutter,
  SiTailwindcss
} from '@icons-pack/react-simple-icons';
import { Section } from '@/components/ui/section';

interface LogoItem {
  name: string;
  icon: React.ReactNode;
}

const logos: LogoItem[] = [
  { name: 'Next.js', icon: <SiNextdotjs className="size-6" /> },
  { name: 'Supabase', icon: <SiSupabase className="size-6" /> },
  { name: 'Stripe', icon: <SiStripe className="size-6" /> },
  { name: 'Flutter', icon: <SiFlutter className="size-6" /> },
  { name: 'Tailwind', icon: <SiTailwindcss className="size-6" /> }
];

export function Logos() {
  return (
    <Section>
      <div className="max-w-container mx-auto flex flex-col items-center gap-8 text-center">
        <h2 className="text-md font-semibold sm:text-2xl">
          Built with industry-standard tools
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-8">
          {logos.map((logo) => (
            <div
              key={logo.name}
              className="flex items-center gap-2 text-muted-foreground"
            >
              {logo.icon}
              <span className="text-sm font-medium">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
