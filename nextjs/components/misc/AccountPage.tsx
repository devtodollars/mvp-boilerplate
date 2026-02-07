'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/landing/Navbar';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { getURL } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/utils/supabase/api';
import { SubscriptionWithPriceAndProduct } from '@/utils/types';
import { Tables } from '@/types_db';

type XmrInvoice = Tables<'xmr_invoices'>;

const statusVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'default';
    case 'payment_detected':
      return 'secondary';
    case 'expired':
      return 'destructive';
    default:
      return 'outline';
  }
};

export default function AccountPage({
  user,
  subscription,
  xmrInvoices
}: {
  user: User;
  subscription: SubscriptionWithPriceAndProduct;
  xmrInvoices: XmrInvoice[] | null;
}) {
  const supabase = createClient();
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBillingPortal = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke('get_stripe_url', {
      body: {
        return_url: getURL('/account')
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

  const handleXmrRenew = async () => {
    if (!subscription?.prices?.products?.id) return;
    setLoading(true);

    const { data, error } = await supabase.functions.invoke('get_xmr_url', {
      body: {
        return_url: getURL('/account'),
        product_id: subscription.prices.products.id
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

  const isXmrSubscription = subscription?.prices?.currency === 'XMR';
  const xmrExpired = isXmrSubscription && subscription?.current_period_end
    ? new Date(subscription.current_period_end) < new Date()
    : false;

  const handleSignOut = async () => {
    setLoading(true);
    const api = createApiClient(supabase);
    await api.signOut();
    toast({
      title: 'Signed out successfully!'
    });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar user={user} />
      <main className="flex min-h-[calc(100vh_-_theme(spacing.16))] flex-1 flex-col gap-4 bg-muted/40 p-4 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="text-3xl font-semibold">Account</h1>
        </div>
        <div className="mx-auto grid w-full max-w-6xl items-start gap-6 md:grid-cols-[180px_1fr] lg:grid-cols-[250px_1fr]">
          <nav
            className="grid gap-4 text-sm text-muted-foreground"
            x-chunk="dashboard-04-chunk-0"
          >
            <Link href="#" className="font-semibold text-primary">
              General
            </Link>
            <Link href="mailto:">Support</Link>
          </nav>
          <div className="grid gap-6">
            <Card x-chunk="dashboard-04-chunk-1">
              <CardHeader>
                <CardTitle>Email</CardTitle>
                <CardDescription>
                  The email associated with your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form>
                  <Input placeholder="Email" value={user.email} disabled />
                </form>
              </CardContent>
            </Card>
            <Card x-chunk="dashboard-04-chunk-2">
              <CardHeader>
                <CardTitle>Your Plan</CardTitle>
                <CardDescription>
                  {subscription
                    ? `You are currently on the ${subscription?.prices?.products?.name || 'Unknown'} plan.`
                    : 'You are not currently subscribed to any plan.'}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t px-6 py-4 flex space-between">
                {isXmrSubscription ? (
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-muted-foreground">
                      {xmrExpired ? (
                        <span className="text-destructive font-medium">Expired</span>
                      ) : subscription?.current_period_end ? (
                        <span>
                          Expires on{' '}
                          {new Date(subscription.current_period_end).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      ) : null}
                    </div>
                    <Button onClick={handleXmrRenew} disabled={loading}>
                      Renew subscription
                    </Button>
                  </div>
                ) : subscription ? (
                  <Button onClick={handleBillingPortal} disabled={loading}>
                    Manage subscription
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
            {xmrInvoices && xmrInvoices.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>XMR Payments</CardTitle>
                  <CardDescription>
                    Your Monero payment history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {xmrInvoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between rounded-md border p-3"
                      >
                        <div className="space-y-1">
                          <p className="text-sm font-medium">
                            {Number(invoice.amount_xmr)} XMR
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {invoice.confirmed_at
                              ? new Date(invoice.confirmed_at).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : new Date(invoice.created_at!).toLocaleDateString(undefined, {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                          </p>
                        </div>
                        <Badge variant={statusVariant(invoice.status)}>
                          {invoice.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
            <Card x-chunk="dashboard-04-chunk-3">
              <CardHeader>
                <CardTitle>Sign out</CardTitle>
                <CardDescription>Sign out of your account</CardDescription>
              </CardHeader>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleSignOut} disabled={loading}>
                  Sign out
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
