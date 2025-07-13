import { About } from '@/components/landing/About';
import { Cta } from '@/components/landing/Cta';
import { FAQ } from '@/components/landing/FAQ';
import { Features } from '@/components/landing/Features';
import { Footer } from '@/components/landing/Footer';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Navbar } from '@/components/landing/Navbar';
import { Newsletter } from '@/components/landing/Newsletter';
import { Pricing } from '@/components/landing/Pricing';
import { ScrollToTop } from '@/components/landing/ScrollToTop';
import { Services } from '@/components/landing/Services';
import { Sponsors } from '@/components/landing/Sponsors';
import { Team } from '@/components/landing/Team';
import { Testimonials } from '@/components/landing/Testimonials';
import { createClient } from '@/utils/supabase/server';

export default async function LandingPage() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  return (
    <>
      <Navbar user={user} />
      <Hero />
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
      <Footer />
      <ScrollToTop />
    </>
  );
}
