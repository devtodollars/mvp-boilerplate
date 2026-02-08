'use client';

import {
  BlocksIcon,
  CreditCardIcon,
  MonitorSmartphoneIcon,
  RocketIcon,
  ShieldIcon,
  ZapIcon,
  BarChartIcon,
  MailIcon
} from 'lucide-react';
import { ReactNode } from 'react';
import { Item, ItemDescription, ItemIcon, ItemTitle } from '@/components/ui/item';
import { Section } from '@/components/ui/section';

interface ItemProps {
  title: string;
  description: string;
  icon: ReactNode;
}

const items: ItemProps[] = [
  {
    title: 'Authentication',
    description: 'Supabase Auth with email, OAuth, and magic links out of the box',
    icon: <ShieldIcon className="size-5 stroke-1" />
  },
  {
    title: 'Cross-platform',
    description: 'Next.js web and Flutter mobile sharing the same backend',
    icon: <MonitorSmartphoneIcon className="size-5 stroke-1" />
  },
  {
    title: 'Payments',
    description: 'Stripe subscriptions and Monero payments fully integrated',
    icon: <CreditCardIcon className="size-5 stroke-1" />
  },
  {
    title: 'Component library',
    description: 'shadcn/ui components with Radix primitives and Tailwind',
    icon: <BlocksIcon className="size-5 stroke-1" />
  },
  {
    title: 'Performance',
    description: 'Server Components, Turbopack, and edge functions for speed',
    icon: <ZapIcon className="size-5 stroke-1" />
  },
  {
    title: 'Production ready',
    description: 'Database migrations, RLS policies, and CI/CD workflows included',
    icon: <RocketIcon className="size-5 stroke-1" />
  },
  {
    title: 'Analytics',
    description: 'PostHog integration for pageviews, events, and user tracking',
    icon: <BarChartIcon className="size-5 stroke-1" />
  },
  {
    title: 'Transactional email',
    description: 'Postmark setup for password resets and notification emails',
    icon: <MailIcon className="size-5 stroke-1" />
  }
];

export function Items() {
  return (
    <Section id="features">
      <div className="max-w-container mx-auto flex flex-col items-center gap-6 sm:gap-20">
        <h2 className="max-w-[560px] text-center text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          Everything you need. Nothing you don't.
        </h2>
        <div className="grid auto-rows-fr grid-cols-2 gap-0 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {items.map((item, index) => (
            <Item key={index}>
              <ItemTitle className="flex items-center gap-2">
                <ItemIcon>{item.icon}</ItemIcon>
                {item.title}
              </ItemTitle>
              <ItemDescription>{item.description}</ItemDescription>
            </Item>
          ))}
        </div>
      </div>
    </Section>
  );
}
