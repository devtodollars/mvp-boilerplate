'use client';

import Button from '@/components/ui/Button';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import { createClient } from '@/utils/supabase/client';
import { getURL } from '@/utils/helpers';

export default function CustomerPortalForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStripePortalRequest = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    const { data } = await supabase.functions.invoke('get_stripe_url', {
      body: {
        return_url: getURL('/account')
      }
    });
    const redirectUrl = data?.redirect_url;
    setIsSubmitting(false);
    return router.push(redirectUrl);
  };

  return (
    <Card
      title="Billing Portal"
      footer={
        <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
          <p className="pb-4 sm:pb-0">
            Manage invoices, payments, and subscriptions on Stripe.
          </p>
          <Button
            variant="slim"
            onClick={handleStripePortalRequest}
            loading={isSubmitting}
          >
            Open billing portal
          </Button>
        </div>
      }
    >
      <div className="mt-8 mb-4 text-xl font-semibold">
        <Link href="/">View Pricing</Link>
      </div>
    </Card>
  );
}
