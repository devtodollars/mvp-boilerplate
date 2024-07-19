import { clientRequestHandlerWithUser } from "../_shared/request.ts";
import { createOrRetrieveCustomer, supabase } from "../_shared/supabase.ts";
import { checkoutWithStripe, createStripePortal } from "../_shared/stripe.ts";
import { posthog } from "../_shared/posthog.ts";

clientRequestHandlerWithUser(async (req, user) => {
  const { price: priceId, return_url } = await req.json();
  const stripeCustomerId = createOrRetrieveCustomer({
    uuid: user.id,
    email: user.email || "",
  });

  // get price based on product
  let redirect_url: string | undefined;
  let event: string;

  // if price exists open checkout, otherwise portal
  const { data: price } = await supabase
    .from("prices")
    .select()
    .eq("id", priceId)
    .maybeSingle();
  if (!price) {
    event = "user opens billing portal";
    redirect_url = await createStripePortal(user, return_url);
  } else {
    event = "user starts checkout";
    redirect_url = await checkoutWithStripe(price, user, return_url);
  }

  posthog.capture({
    distinctId: user.id,
    event,
    properties: {
      price,
      $set: {
        stripe_customer_id: stripeCustomerId,
      },
    },
  });

  return new Response(JSON.stringify({ redirect_url }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
});
