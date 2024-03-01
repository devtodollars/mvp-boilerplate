import { clientRequestHandler, corsHeaders } from "../_shared/request.ts";
import { supabase } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";

clientRequestHandler(async (req, user) => {
  const { price, return_url } = await req.json();
  // get stripe information from stripe table!
  const { data } = await supabase.from("stripe").select().eq(
    "user_id",
    user.id,
  ).maybeSingle();
  let stripeCustomerId = data?.stripe_customer_id;
  const activeProducts: string[] = data?.active_products || [];
  if (!stripeCustomerId) {
    // create stripe customer if doesn't exist
    const customer = await stripe.customers.create({
      phone: user.phone,
      email: user.email,
      metadata: {
        uid: user.id,
      },
    });
    stripeCustomerId = customer.id;
    console.log(`created stripe customer: ${customer.id}`);
    await supabase.from("stripe").upsert({
      user_id: user.id,
      stripe_customer_id: customer.id,
    });
  }

  // get price based on product
  let redirect_url: string | undefined;

  // check if user paid for product
  const priceObj = price ? await stripe.prices.retrieve(price) : null;
  if (priceObj === null || activeProducts.includes(priceObj.product)) {
    // open billing portal if product/subscription has been purchased
    // or if price is null
    console.log("open billing portal session");
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: return_url || undefined,
    });
    redirect_url = session?.url;
  } else {
    // open checkout session to purchase product
    console.log("open checkout session");
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: (priceObj.type == "recurring") ? "subscription" : "payment",
      line_items: [{
        price,
        quantity: 1,
      }],
      allow_promotion_codes: true,
      success_url: return_url || undefined,
      cancel_url: return_url || undefined,
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
