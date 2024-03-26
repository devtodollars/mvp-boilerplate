import Pricing from '@/components/ui/Pricing/Pricing';
import { createClient } from '@/utils/supabase/server';

export default async function PricingPage() {
  const supabase = createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  // TODO: don't pass in products or subscription
  return <Pricing user={user} products={[]} subscription={null} />;
}
