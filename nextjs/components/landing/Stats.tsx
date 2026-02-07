'use client';

import { Section } from '@/components/ui/section';

interface StatItem {
  label?: string;
  value: string | number;
  suffix?: string;
  description?: string;
}

const stats: StatItem[] = [
  {
    label: 'includes',
    value: 2,
    description: 'frontend frameworks: Next.js and Flutter'
  },
  {
    label: 'over',
    value: 15,
    description: 'pre-built UI components and sections'
  },
  {
    label: 'supports',
    value: 6,
    description: 'platforms: Web, iOS, Android, macOS, Linux, Windows'
  },
  {
    label: 'integrates',
    value: 4,
    description: 'services: Supabase, Stripe, PostHog, Postmark'
  }
];

export function Stats() {
  return (
    <Section>
      <div className="container mx-auto max-w-[960px]">
        <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
          {stats.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-start gap-3 text-left"
            >
              {item.label && (
                <div className="text-muted-foreground text-sm font-semibold">
                  {item.label}
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <div className="from-foreground to-foreground dark:to-brand bg-linear-to-r bg-clip-text text-4xl font-medium text-transparent drop-shadow-[2px_1px_24px_var(--brand-foreground)] transition-all duration-300 sm:text-5xl md:text-6xl">
                  {item.value}
                </div>
                {item.suffix && (
                  <div className="text-brand text-2xl font-semibold">
                    {item.suffix}
                  </div>
                )}
              </div>
              {item.description && (
                <div className="text-muted-foreground text-sm font-semibold text-pretty">
                  {item.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
