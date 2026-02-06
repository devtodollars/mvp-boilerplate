'use client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getURL } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';
import { SubscriptionWithPriceAndProduct } from '@/utils/types';

enum PopularPlanType {
  NO = 0,
  YES = 1
}

type PaymentMethod = 'stripe' | 'monero';

interface PricingTier {
  title: string;
  popular: PopularPlanType;
  fallbackPrice: number;
  fallbackPriceXmr?: number;
  description: string;
  buttonText: string;
  benefitList: string[];
  redirectURL?: string;
}

// Static tier configuration - prices are fetched from database
const pricingTiers: PricingTier[] = [
  {
    title: 'Free',
    popular: 0,
    fallbackPrice: 0,
    description:
      'Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.',
    buttonText: 'Get Started',
    benefitList: [
      '1 Team member',
      '2 GB Storage',
      'Up to 4 pages',
      'Community support',
      'lorem ipsum dolor'
    ],
    redirectURL: '/account'
  },
  {
    title: 'Hobby',
    popular: 1,
    fallbackPrice: 10,
    fallbackPriceXmr: 0.0001,
    description:
      'Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.',
    buttonText: 'Subscribe Now',
    benefitList: [
      '4 Team member',
      '4 GB Storage',
      'Upto 6 pages',
      'Priority support',
      'lorem ipsum dolor'
    ]
  },
  {
    title: 'Freelancer',
    popular: 0,
    fallbackPrice: 20,
    fallbackPriceXmr: 0.1,
    description:
      'Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.',
    buttonText: 'Subscribe Now',
    benefitList: [
      '10 Team member',
      '8 GB Storage',
      'Upto 10 pages',
      'Priority support',
      'lorem ipsum dolor'
    ]
  }
];

interface XmrProduct {
  id: string;
  name: string;
  xmr_prices: {
    id: string;
    amount_xmr: number;
    active: boolean | null;
  }[];
}

interface StripeProduct {
  id: string;
  name: string | null;
  prices: {
    id: string;
    unit_amount: number | null;
    active: boolean | null;
  }[];
}

export const Pricing = ({
  user,
  subscription
}: {
  user: User | null;
  subscription: SubscriptionWithPriceAndProduct | null;
}) => {
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [xmrProducts, setXmrProducts] = useState<XmrProduct[]>([]);
  const [stripeProducts, setStripeProducts] = useState<StripeProduct[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      // Fetch XMR products with prices
      const { data: xmrData } = await supabase
        .from('xmr_products')
        .select('*, xmr_prices(*)')
        .eq('active', true)
        .eq('xmr_prices.active', true);
      if (xmrData) {
        setXmrProducts(xmrData as unknown as XmrProduct[]);
      }

      // Fetch Stripe products with prices
      const { data: stripeData } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true);
      if (stripeData) {
        setStripeProducts(stripeData as unknown as StripeProduct[]);
      }
      setProductsLoading(false);
    };
    fetchProducts();
  }, [supabase]);

  const getStripeProduct = (tierName: string): StripeProduct | undefined => {
    return stripeProducts.find(
      (p) => p.name?.toLowerCase() === tierName.toLowerCase()
    );
  };

  const getStripePriceId = (tierName: string): string | undefined => {
    const product = getStripeProduct(tierName);
    return product?.prices?.[0]?.id;
  };

  const getStripePrice = (tier: PricingTier): number => {
    const product = getStripeProduct(tier.title);
    const unitAmount = product?.prices?.[0]?.unit_amount;
    // unit_amount is in cents, convert to dollars
    return unitAmount ? unitAmount / 100 : tier.fallbackPrice;
  };

  const getXmrProduct = (tierName: string): XmrProduct | undefined => {
    return xmrProducts.find(
      (p) => p.name.toLowerCase() === tierName.toLowerCase()
    );
  };

  const getXmrProductId = (tierName: string): string | undefined => {
    return getXmrProduct(tierName)?.id;
  };

  const getXmrPrice = (tier: PricingTier): number | undefined => {
    const product = getXmrProduct(tier.title);
    const amountXmr = product?.xmr_prices?.[0]?.amount_xmr;
    return amountXmr ?? tier.fallbackPriceXmr;
  };

  const handleClick = async (tier: PricingTier) => {
    if (tier.redirectURL) {
      return router.push(tier.redirectURL);
    }
    setLoading(true);

    if (!user) {
      setLoading(false);
      return router.push('/auth/signup');
    }

    if (paymentMethod === 'monero') {
      const xmrProductId = getXmrProductId(tier.title);
      if (!xmrProductId) {
        setLoading(false);
        return toast({
          title: 'Monero payment not available',
          description: 'This tier does not support Monero payments.',
          variant: 'destructive'
        });
      }

      const { data, error } = await supabase.functions.invoke('get_xmr_url', {
        body: {
          return_url: getURL('/#pricing'),
          product_id: xmrProductId
        }
      });

      if (error) {
        setLoading(false);
        return toast({
          title: 'Error Occurred',
          description: error.message,
          variant: 'destructive'
        });
      }

      const redirectUrl = data?.redirect_url;
      if (!redirectUrl) {
        setLoading(false);
        return toast({
          title: 'An unknown error occurred.',
          description:
            'Please try again later or contact a system administrator.',
          variant: 'destructive'
        });
      }
      router.push(redirectUrl);
      setLoading(false);
      return;
    }

    // Get the Stripe price ID from the database
    const stripePriceId = getStripePriceId(tier.title);
    if (!stripePriceId) {
      setLoading(false);
      return toast({
        title: 'Price not found',
        description: 'This tier is not available. Please try again later.',
        variant: 'destructive'
      });
    }

    const { data, error } = await supabase.functions.invoke('get_stripe_url', {
      body: {
        return_url: getURL('/#pricing'),
        price: stripePriceId
      }
    });
    if (error) {
      setLoading(false);
      return toast({
        title: 'Error Occurred',
        description: error.message,
        variant: 'destructive'
      });
    }
    const redirectUrl = data?.redirect_url;
    if (!redirectUrl) {
      setLoading(false);
      return toast({
        title: 'An unknown error occurred.',
        description:
          'Please try again later or contact a system administrator.',
        variant: 'destructive'
      });
    }
    router.push(redirectUrl);
    setLoading(false);
  };
  return (
    <section id="pricing" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Layered Monero gradient background - organic aurora-like movement */}

      {/* Base layer - slow diagonal drift */}
      <div
        className="absolute inset-0 -z-10 transition-opacity duration-1000 ease-in-out"
        style={{
          background: 'linear-gradient(135deg, #ff6601 0%, transparent 50%, #4c4c4c 100%)',
          backgroundSize: '400% 400%',
          animation: 'gradient-drift 30s ease-in-out infinite',
          opacity: paymentMethod === 'monero' ? 0.3 : 0
        }}
      />

      {/* Middle layer - counter-rotating radial gradient */}
      <div
        className="absolute inset-[-50%] -z-10 transition-opacity duration-1000 ease-in-out"
        style={{
          background: 'radial-gradient(ellipse at center, #ff6601 0%, transparent 50%, #4c4c4c 80%, transparent 100%)',
          animation: 'gradient-rotate 60s linear infinite',
          opacity: paymentMethod === 'monero' ? 0.2 : 0
        }}
      />

      {/* Top layer - breathing glow effect */}
      <div
        className="absolute inset-0 -z-10 transition-opacity duration-1000 ease-in-out"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(255, 102, 1, 0.4) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(76, 76, 76, 0.3) 0%, transparent 50%)',
          animation: 'gradient-breathe 8s ease-in-out infinite',
          opacity: paymentMethod === 'monero' ? 1 : 0
        }}
      />

      {/* Subtle overlay for text readability */}
      <div
        className="absolute inset-0 -z-10 bg-background/60 dark:bg-background/70 transition-opacity duration-1000 ease-in-out"
        style={{ opacity: paymentMethod === 'monero' ? 1 : 0 }}
      />

      <div className="container">
        <h2 className="text-3xl md:text-4xl font-bold text-center">
          Get
          <span className="bg-gradient-to-b from-primary/60 to-primary text-transparent bg-clip-text">
            {' '}
            Unlimited{' '}
          </span>
          Access
        </h2>
        <h3 className="text-xl text-center text-muted-foreground pt-4 pb-8">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Alias
          reiciendis.
        </h3>
        {hasActiveSubscription ? (
          <div className="flex justify-center items-center gap-4 pb-8">
            <span className="text-sm font-medium text-muted-foreground">
              You have an active subscription
            </span>
          </div>
        ) : (
          <div className="flex justify-center items-center gap-4 pb-8">
            <span
              className={`text-sm font-medium transition-colors duration-300 ${paymentMethod === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Pay with Card
            </span>
            <button
              onClick={() =>
                setPaymentMethod(paymentMethod === 'stripe' ? 'monero' : 'stripe')
              }
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 overflow-hidden"
              style={{
                background: paymentMethod === 'monero'
                  ? 'linear-gradient(90deg, #ff6601 0%, #4c4c4c 50%, #ff6601 100%)'
                  : '#d1d5db',
                backgroundSize: paymentMethod === 'monero' ? '200% 100%' : '100% 100%',
                animation: paymentMethod === 'monero' ? 'gradient-flow 3s ease-in-out infinite' : 'none',
                boxShadow: paymentMethod === 'monero' ? '0 0 20px rgba(255, 102, 1, 0.4)' : 'none'
              }}
              role="switch"
              aria-checked={paymentMethod === 'monero'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-300 shadow-md ${
                  paymentMethod === 'monero' ? 'translate-x-8' : 'translate-x-1'
                }`}
                style={{
                  boxShadow: paymentMethod === 'monero'
                    ? '0 2px 8px rgba(255, 102, 1, 0.5)'
                    : '0 2px 4px rgba(0,0,0,0.1)'
                }}
              />
            </button>
            <span
              className={`text-sm font-semibold transition-all duration-300 ${
                paymentMethod === 'monero'
                  ? 'bg-gradient-to-r from-[#ff6601] to-[#ff8534] bg-clip-text text-transparent'
                  : 'text-muted-foreground'
              }`}
            >
              Pay with Monero
            </span>
          </div>
        )}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier: PricingTier) => (
            <Card
              key={tier.title}
              className={
                tier.popular === PopularPlanType.YES
                  ? 'drop-shadow-xl shadow-black/10 dark:shadow-white/10'
                  : ''
              }
            >
              <CardHeader>
                <CardTitle className="flex item-center justify-between">
                  {tier.title}
                  {tier.popular === PopularPlanType.YES ? (
                    <Badge variant="secondary" className="text-sm text-primary">
                      Most popular
                    </Badge>
                  ) : null}
                </CardTitle>
                <div>
                  {productsLoading && !tier.redirectURL ? (
                    <div className="flex items-baseline gap-1">
                      <Skeleton className="h-9 w-16" />
                      <span className="text-muted-foreground"> /month</span>
                    </div>
                  ) : paymentMethod === 'monero' && getXmrPrice(tier) ? (
                    <>
                      <span className="text-3xl font-bold text-orange-500">
                        {getXmrPrice(tier)} XMR
                      </span>
                      <span className="text-muted-foreground"> /month</span>
                    </>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">${getStripePrice(tier)}</span>
                      <span className="text-muted-foreground"> /month</span>
                    </>
                  )}
                </div>

                <CardDescription>{tier.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => handleClick(tier)}
                  disabled={loading || (productsLoading && !tier.redirectURL) || (hasActiveSubscription && !tier.redirectURL)}
                >
                  {hasActiveSubscription && !tier.redirectURL ? 'Subscribed' : tier.buttonText}
                </Button>
              </CardContent>

              <hr className="w-4/5 m-auto mb-4" />

              <CardFooter className="flex">
                <div className="space-y-4">
                  {tier.benefitList.map((benefit: string) => (
                    <span key={benefit} className="flex">
                      <Check className="text-green-500" />{' '}
                      <h3 className="ml-2">{benefit}</h3>
                    </span>
                  ))}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
