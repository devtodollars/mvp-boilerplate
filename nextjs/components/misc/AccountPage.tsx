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
import { Navbar } from '@/components/landing/Navbar';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { getURL } from '@/utils/helpers';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { createApiClient } from '@/utils/supabase/api';

export default function AccountPage({ user }: { user: User }) {
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

  const handleSignOut = async () => {
    setLoading(true);
    const api = createApiClient(supabase);
    await api.signOut();
    toast({
      title: 'Signed out successfully!'
    });
    return router.replace('/');
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
                <CardTitle>Billing Portal</CardTitle>
                <CardDescription>Manage your billing on Stripe</CardDescription>
              </CardHeader>
              <CardFooter className="border-t px-6 py-4">
                <Button onClick={handleBillingPortal} disabled={loading}>
                  Open customer portal
                </Button>
              </CardFooter>
            </Card>
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
