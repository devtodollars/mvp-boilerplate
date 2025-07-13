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
import { useState } from 'react';
import { getURL } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';

enum PopularPlanType {
  NO = 0,
  YES = 1
}

interface PricingProps {
  id?: string;
  title: string;
  popular: PopularPlanType;
  price: number;
  description: string;
  buttonText: string;
  benefitList: string[];
  redirectURL?: string;
  comingSoon?: boolean;
}

const pricingList: PricingProps[] = [
  {
    title: 'Post a Room',
    popular: 1,
    price: 5,
    comingSoon: false,
    description:
      'Find your next roomate, this price will NEVER change',
    buttonText: 'Get Started',
    benefitList: [
      "In App Messaging",
      "Tenant Profiles",
      "Transparent Queueing System",
      "Application Tracking",
      "Secure ID Verification"
    ],
    redirectURL: '/account'
  },
  {
    id: 'price_1Pdy8yFttF99a1NCLpDa83xf',
    title: 'Post a Property',
    popular: 0,
    comingSoon: true,
    price: 75,
    description:
      'Posting properties with more features coming soon',
    buttonText: 'Coming Soon',
    benefitList: [
      "In App Messaging",
      "Tenant Profiles",
      "Scam and Deposit Protection",
      "Transparent Queueing System",
      "Deposit Protection",
      "Payment management"
    ]
  }
  // {
  //   id: 'price_1Pdy8zFttF99a1NCGQJc5ZTZ',
  //   title: 'Freelancer',
  //   popular: 0,
  //   price: 20,
  //   description:
  //     'Lorem ipsum dolor sit, amet ipsum consectetur adipisicing elit.',
  //   buttonText: 'Subscribe Now',
  //   benefitList: [
  //     '10 Team member',
  //     '8 GB Storage',
  //     'Upto 10 pages',
  //     'Priority support',
  //     'lorem ipsum dolor'
  //   ]
  // }
];

export const Pricing = ({ user }: { user: User | null }) => {
  const { toast } = useToast();
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState<boolean>(false);
  const handleClick = async (price: PricingProps) => {
    if (price.redirectURL) {
      return router.push(price.redirectURL);
    }
    setLoading(true);

    if (!user) {
      setLoading(false);
      return router.push('/auth/signup');
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
        title: 'Error Occured',
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
      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8">
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
                {/* {pricing.popular === PopularPlanType.YES ? (
                  <Badge variant="secondary" className="text-sm text-primary">
                    Most popular
                  </Badge>
                ) : null} */}
                {pricing.comingSoon ? (
                  <Badge variant="secondary" className="text-sm text-primary">
                    Coming Soon
                  </Badge>
                ) : null}
              </CardTitle>
              <div>
                <span className="text-3xl font-bold">€{pricing.price}</span>
                <span className="text-muted-foreground"> / 90 days</span>
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
