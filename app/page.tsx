import { About } from '@/components/landing/About';
import { Cta } from '@/components/landing/Cta';
import { FAQ } from '@/components/landing/FAQ';
import { Features } from '@/components/landing/Features';
import { Hero } from '@/components/landing/Hero';
import { Pricing } from '@/components/landing/Pricing';
import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <>
      <Hero user={user} />
      {/* <Sponsors />  //no need for now */}
      {/* <HowItWorks /> // no need for now */}
      <Features />
      <Pricing user={user} />
      {/* <Services /> */}
      <Cta />
      {/* <Testimonials /> */}
      {/* <Team /> // no need for now */}
      <About />
      {/* <Newsletter /> */}
      <FAQ />
    </>
  );
}
