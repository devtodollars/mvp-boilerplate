import { clientRequestHandler, corsHeaders } from "../_shared/request.ts";
import { supabase } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";

clientRequestHandler(async (req, user) => {
  const { price, return_url } = await req.json();
  // get stripe information from customers table!
  const { data } = await supabase.from("customers").select().eq(
    "user_id",
    user.id,
  ).maybeSingle();
  let stripeCustomerId = data?.stripe_customer_id;
  const paidProducts: string[] = data?.one_time_payment_products;
  const activeSubscriptionProduct: string = data?.active_subscription_product;
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
    await supabase.from("customers").upsert({
      user_id: user.id,
      stripe_customer_id: customer.id,
    });
  }

  // query price product based on price
  const priceObj = await stripe.prices.retrieve(price);

  // get price based on product
  let redirect_url: string | undefined;

  if ([...paidProducts, activeSubscriptionProduct].includes(priceObj.product)) {
    // open billing portal if product has been purchased
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
      mode: (priceObj.type == "recurring") ? "subscription" : "payment",
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
