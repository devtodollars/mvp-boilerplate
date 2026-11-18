import { Cta } from '@/components/landing/Cta';
import { FAQ } from '@/components/landing/FAQ';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { Items } from '@/components/landing/Items';
import { Logos } from '@/components/landing/Logos';
import { Navbar } from '@/components/landing/Navbar';
import { Pricing } from '@/components/landing/Pricing';
import { Stats } from '@/components/landing/Stats';
import { createClient } from '@/utils/supabase/server';
import { getSubscription, getUser } from '@/utils/supabase/queries';

export default async function LandingPage() {
  const supabase = await createClient();

  const user = await getUser(supabase);

  const subscription = await getSubscription(supabase);

  return (
    <>
      <Navbar user={user} />
      <Hero />
      <Logos />
      <Items />
      <Stats />
      <Pricing user={user} subscription={subscription} />
      <FAQ />
      <Cta />
      <Footer />
    </>
  );
}
