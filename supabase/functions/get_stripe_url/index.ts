import { clientRequestHandler, corsHeaders } from "../_shared/request.ts";
import { supabase } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";

clientRequestHandler(async (req, user) => {
  const { price, return_url } = await req.json();
  // get stripe information from user_metadata table!
  const { data: metadata } = await supabase.from("user_metadata").select(
    "stripe_customer_id,tier",
  ).eq(
    "user_id",
    user.id,
  ).maybeSingle();
  let stripeCustomerId = metadata?.stripe_customer_id;
  const tier = metadata?.tier;
  if (!stripeCustomerId) {
    // create stripe customer if doesn't exist
    console.log("create stripe customer");
    const customer = await stripe.customers.create({
      phone: user.phone,
      email: user.email,
      metadata: {
        uid: user.id,
      },
    });
    stripeCustomerId = customer.id;
    await supabase.from("user_metadata").upsert({
      user_id: user.id,
      stripe_customer_id: customer.id,
    });
  }
  let redirect_url: string | undefined;
  if (tier) {
    // open billing portal
    console.log("open billing portal session");
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url,
    });
    redirect_url = session?.url;
  } else {
    // if tier is null go to checkout page
    console.log("open checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "payment",
      line_items: [{
        price,
        quantity: 1,
      }],
      allow_promotion_codes: true,
      success_url: return_url,
      cancel_url: return_url,
    });
    redirect_url = session?.url;
  }
  return new Response(
    JSON.stringify({ redirect_url }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
