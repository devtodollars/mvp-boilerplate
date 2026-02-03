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
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getURL } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';

enum PopularPlanType {
  NO = 0,
  YES = 1
}

type PaymentMethod = 'stripe' | 'monero';

interface PricingProps {
  id?: string;
  xmrProductId?: string;
  title: string;
  popular: PopularPlanType;
  price: number;
  priceXmr?: number;
  description: string;
  buttonText: string;
  benefitList: string[];
  redirectURL?: string;
}

const pricingList: PricingProps[] = [
  {
    title: 'Free',
    popular: 0,
    price: 0,
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
    id: 'price_1Pdy8yFttF99a1NCLpDa83xf',
    title: 'Hobby',
    popular: 1,
    price: 10,
    priceXmr: 0.0001,
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
    id: 'price_1Pdy8zFttF99a1NCGQJc5ZTZ',
    title: 'Freelancer',
    popular: 0,
    price: 20,
    priceXmr: 0.1,
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
  amount_xmr: number;
}

export const Pricing = ({ user }: { user: User | null }) => {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('stripe');
  const [xmrProducts, setXmrProducts] = useState<XmrProduct[]>([]);

  useEffect(() => {
    const fetchXmrProducts = async () => {
      // Note: xmr_products table types will be available after running:
      // pnpm supabase:generate-types
      const { data } = await supabase
        .from('xmr_products' as 'products')
        .select('*');
      if (data) {
        setXmrProducts(data as unknown as XmrProduct[]);
      }
    };
    fetchXmrProducts();
  }, [supabase]);

  const getXmrProduct = (tierName: string): XmrProduct | undefined => {
    return xmrProducts.find(
      (p) => p.name.toLowerCase() === tierName.toLowerCase()
    );
  };

  const getXmrProductId = (tierName: string): string | undefined => {
    return getXmrProduct(tierName)?.id;
  };

  const getXmrPrice = (pricing: PricingProps): number | undefined => {
    const product = getXmrProduct(pricing.title);
    return product?.amount_xmr ?? pricing.priceXmr;
  };

  const handleClick = async (price: PricingProps) => {
    if (price.redirectURL) {
      return router.push(price.redirectURL);
    }
    setLoading(true);

    if (!user) {
      setLoading(false);
      return router.push('/auth/signup');
    }

    if (paymentMethod === 'monero') {
      const xmrProductId = getXmrProductId(price.title);
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

    const { data, error } = await supabase.functions.invoke('get_stripe_url', {
      body: {
        return_url: getURL('/#pricing'),
        price: price.id
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
    <section id="pricing" className="container py-24 sm:py-32">
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
      <div className="flex justify-center items-center gap-4 pb-8">
        <span
          className={`text-sm font-medium ${paymentMethod === 'stripe' ? 'text-primary' : 'text-muted-foreground'}`}
        >
          Pay with Card
        </span>
        <button
          onClick={() =>
            setPaymentMethod(paymentMethod === 'stripe' ? 'monero' : 'stripe')
          }
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            paymentMethod === 'monero' ? 'bg-orange-500' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={paymentMethod === 'monero'}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              paymentMethod === 'monero' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <span
          className={`text-sm font-medium ${paymentMethod === 'monero' ? 'text-orange-500' : 'text-muted-foreground'}`}
        >
          Pay with Monero
        </span>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {pricingList.map((pricing: PricingProps) => (
          <Card
            key={pricing.title}
            className={
              pricing.popular === PopularPlanType.YES
                ? 'drop-shadow-xl shadow-black/10 dark:shadow-white/10'
                : ''
            }
          >
            <CardHeader>
              <CardTitle className="flex item-center justify-between">
                {pricing.title}
                {pricing.popular === PopularPlanType.YES ? (
                  <Badge variant="secondary" className="text-sm text-primary">
                    Most popular
                  </Badge>
                ) : null}
              </CardTitle>
              <div>
                {paymentMethod === 'monero' && getXmrPrice(pricing) ? (
                  <>
                    <span className="text-3xl font-bold text-orange-500">
                      {getXmrPrice(pricing)} XMR
                    </span>
                    <span className="text-muted-foreground"> /month</span>
                  </>
                ) : (
                  <>
                    <span className="text-3xl font-bold">${pricing.price}</span>
                    <span className="text-muted-foreground"> /month</span>
                  </>
                )}
              </div>

              <CardDescription>{pricing.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <Button
                className="w-full"
                onClick={() => handleClick(pricing)}
                disabled={loading}
              >
                {pricing.buttonText}
              </Button>
            </CardContent>

            <hr className="w-4/5 m-auto mb-4" />

            <CardFooter className="flex">
              <div className="space-y-4">
                {pricing.benefitList.map((benefit: string) => (
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
    </section>
  );
};
