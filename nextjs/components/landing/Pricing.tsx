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
import { Section } from '@/components/ui/section';
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

interface PricingTier {
  title: string;
  popular: PopularPlanType;
  fallbackPrice: number;
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

interface ProductWithPrices {
  id: string;
  name: string | null;
  prices: {
    id: string;
    unit_amount: number | null;
    currency: string | null;
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
  const hasActiveSubscription =
    subscription?.status === 'active' || subscription?.status === 'trialing';
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [productsLoading, setProductsLoading] = useState<boolean>(true);
  const [products, setProducts] = useState<ProductWithPrices[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      const { data } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true);
      if (data) {
        setProducts(data as unknown as ProductWithPrices[]);
      }
      setProductsLoading(false);
    };
    fetchProducts();
  }, [supabase]);

  const getProduct = (tierName: string): ProductWithPrices | undefined => {
    return products.find(
      (p) => p.name?.toLowerCase() === tierName.toLowerCase()
    );
  };

  const getStripePriceId = (tierName: string): string | undefined => {
    const product = getProduct(tierName);
    const usdPrice = product?.prices?.find((p) => p.currency === 'USD');
    return usdPrice?.id;
  };

  const getStripePrice = (tier: PricingTier): number => {
    const product = getProduct(tier.title);
    const usdPrice = product?.prices?.find((p) => p.currency === 'USD');
    const unitAmount = usdPrice?.unit_amount;
    // unit_amount is in cents, convert to dollars
    return unitAmount ? unitAmount / 100 : tier.fallbackPrice;
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

    const { data, error } = await supabase.functions.invoke(
      'get_stripe_url',
      {
        body: {
          return_url: getURL('/#pricing'),
          price: stripePriceId
        }
      }
    );
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
    <Section
      id="pricing"
      className="relative overflow-hidden"
    >
      <div className="max-w-container mx-auto">
        <h2 className="text-center text-3xl leading-tight font-semibold sm:text-5xl sm:leading-tight">
          Get Unlimited Access
        </h2>
        <p className="text-xl text-center text-muted-foreground pt-4 pb-8">
          Choose the plan that works for you.
        </p>
        {hasActiveSubscription ? (
          <div className="flex justify-center items-center gap-4 pb-8">
            <span className="text-sm font-medium text-muted-foreground">
              You have an active subscription
            </span>
          </div>
        ) : null}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {pricingTiers.map((tier: PricingTier) => (
            <Card
              key={tier.title}
              className={`glass-4 ${
                tier.popular === PopularPlanType.YES
                  ? 'drop-shadow-xl shadow-black/10 dark:shadow-white/10'
                  : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex item-center justify-between">
                  {tier.title}
                  {tier.popular === PopularPlanType.YES ? (
                    <Badge
                      variant="secondary"
                      className="text-sm text-primary"
                    >
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
                  ) : (
                    <>
                      <span className="text-3xl font-bold">
                        ${getStripePrice(tier)}
                      </span>
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
                  disabled={
                    loading ||
                    (productsLoading && !tier.redirectURL) ||
                    (hasActiveSubscription && !tier.redirectURL)
                  }
                >
                  {hasActiveSubscription && !tier.redirectURL
                    ? 'Subscribed'
                    : tier.buttonText}
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
    </Section>
  );
};
