'use client';

import Button from '@/components/ui/Button';
import LogoCloud from '@/components/ui/LogoCloud';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { getErrorRedirect } from '@/utils/helpers';
import cn from 'classnames';
import { getURL } from '@/utils/helpers';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';

type Props = {
  user?: User | null;
};

type Price = {
  id: string;
  redirectURL?: string;
  emphasize?: boolean;
  description?: string;
  interval?: string;
  name: string;
  cost: string;
  features: string[];
};

const prices = [
  {
    id: process.env.NEXT_PUBLIC_STRIPE_DOCS_PRICE_ID!,
    name: 'Docs',
    features: ['✓ Private Documentation'],
    cost: '$99'
  },
  {
    id: process.env.NEXT_PUBLIC_STRIPE_DOCS_AND_SUPPORT_PRICE_ID!,
    name: 'Docs + Support',
    features: [
      '✓ Private Documentation',
      '✓ Discord – Text Support',
      '✓ Discord – Weekly Office Hours',
      '✓ 30 min Consulting ($50 value)'
    ],
    cost: '$129',
    emphasize: true
  },
  {
    name: "I'll Build Your MVP",
    features: [
      '✓ Technical Co-founder',
      '✓ Completed MVP',
      '✓ Landing Page',
      '✓ Code Documentation'
    ],
    cost: '$5000',
    redirectURL: 'https://usemotion.com/meet/ithinkwong/mvp-consulting?d=30'
  }
] as Price[];

export default function Pricing({ user }: Props) {
  const router = useRouter();
  const intervals = Array.from(new Set(prices.map((p) => p.interval)));
  const [billingInterval, setBillingInterval] = useState<string | undefined>(
    intervals.find((i) => i)
  );
  const [priceIdLoading, setPriceIdLoading] = useState<string | null>(null);
  const currentPath = usePathname();

  const subscription = null;

  const handleClick = async (price: Price) => {
    if (price.redirectURL) {
      return router.push(price.redirectURL);
    }
    setPriceIdLoading(price.id);

    if (!user) {
      setPriceIdLoading(null);
      return router.push('/signin/signup');
    }

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('get_stripe_url', {
      body: {
        return_url: getURL(),
        price: price.id
      }
    });
    if (error) {
      setPriceIdLoading(null);
      return router.push(
        getErrorRedirect(currentPath, 'Error Occured', error.message)
      );
    }
    const redirectUrl = data?.redirect_url;
    if (!redirectUrl) {
      setPriceIdLoading(null);
      return router.push(
        getErrorRedirect(
          currentPath,
          'An unknown error occurred.',
          'Please try again later or contact a system administrator.'
        )
      );
    }
    router.push(redirectUrl);
    setPriceIdLoading(null);
  };

  if (!prices.length) {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center"></div>
          <p className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
            No subscription pricing plans found. Create them in your{' '}
            <a
              className="text-pink-500 underline"
              href="https://dashboard.stripe.com/products"
              rel="noopener noreferrer"
              target="_blank"
            >
              Stripe Dashboard
            </a>
            .
          </p>
        </div>
        <LogoCloud />
      </section>
    );
  } else {
    return (
      <section className="bg-black">
        <div className="max-w-6xl px-4 py-8 mx-auto sm:py-24 sm:px-6 lg:px-8">
          <div className="sm:flex sm:flex-col sm:align-center">
            <h1 className="text-4xl font-extrabold text-white sm:text-center sm:text-6xl">
              Pricing Plans
            </h1>
            <p className="max-w-2xl m-auto mt-5 text-xl text-zinc-200 sm:text-center sm:text-2xl">
              <b>Free, open-source code</b>,<br />
              but paid documentation and support
            </p>
            <div className="relative self-center mt-6 bg-zinc-900 rounded-lg p-0.5 flex sm:mt-8 border border-zinc-800">
              {intervals.includes('month') && (
                <button
                  onClick={() => setBillingInterval('month')}
                  type="button"
                  className={`${
                    billingInterval === 'month'
                      ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                      : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                  } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
                >
                  Monthly billing
                </button>
              )}
              {intervals.includes('year') && (
                <button
                  onClick={() => setBillingInterval('year')}
                  type="button"
                  className={`${
                    billingInterval === 'year'
                      ? 'relative w-1/2 bg-zinc-700 border-zinc-800 shadow-sm text-white'
                      : 'ml-0.5 relative w-1/2 border border-transparent text-zinc-400'
                  } rounded-md m-1 py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-opacity-50 focus:z-10 sm:w-auto sm:px-8`}
                >
                  Yearly billing
                </button>
              )}
            </div>
          </div>
          <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 flex flex-wrap justify-center gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
            {prices.map((price, i) => {
              if (!price || billingInterval != price.interval) return null;
              return (
                <div
                  key={i}
                  className={cn(
                    'flex flex-col rounded-lg shadow-sm divide-y divide-zinc-600 bg-zinc-900',
                    {
                      'border border-pink-500': price.emphasize
                    },
                    'flex-1', // This makes the flex item grow to fill the space
                    'basis-1/3', // Assuming you want each card to take up roughly a third of the container's width
                    'max-w-xs' // Sets a maximum width to the cards to prevent them from getting too large
                  )}
                >
                  <div className="p-6 h-full flex flex-col justify-between">
                    <h2 className="text-2xl font-semibold leading-6 text-white">
                      {price.name}
                    </h2>
                    <p className="mt-4 text-zinc-300">{price.description}</p>
                    <p className="my-8">
                      <span className="text-5xl font-extrabold white">
                        {price.cost}
                      </span>
                      {price.interval && (
                        <span className="text-base font-medium text-zinc-100">
                          /{price.interval}
                        </span>
                      )}
                    </p>
                    <div className="flex-grow">
                      {price.features.map((f, i) => {
                        return (
                          <p key={i} className="mb-4 text-zinc-300">
                            {f}
                          </p>
                        );
                      })}
                    </div>
                    <Button
                      variant="slim"
                      type="button"
                      loading={priceIdLoading !== null}
                      onClick={() => handleClick(price)}
                      className="block w-full py-2 mt-8 text-sm font-semibold text-center text-white rounded-md hover:bg-zinc-900"
                    >
                      {subscription ? 'Manage' : 'Subscribe'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <LogoCloud />
        </div>
      </section>
    );
  }
}
