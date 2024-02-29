// import Stripe from "stripe";
import { processWebhookRequest } from "../_shared/stripe.ts";
import { supabase } from "../_shared/supabase.ts";
import Stripe from "stripe";

Deno.serve(async (req) => {
  let receivedEvent;
  try {
    receivedEvent = await processWebhookRequest(req);
  } catch (e) {
    return new Response(e.message, { status: 400 });
  }

  console.log(`🔔 Received event: ${receivedEvent.type}`);
  const object = receivedEvent.data.object;
  switch (receivedEvent.type) {
    case "customer.subscription.deleted":
      await onSubscriptionUpdated(object, true);
      break;
    case "customer.subscription.updated":
      await onSubscriptionUpdated(object);
      break;
    case "customer.subscription.created":
      await onSubscriptionUpdated(object);
      break;
    case "checkout.session.completed":
      await onCheckoutComplete(object);
      break;
  }
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

async function onSubscriptionUpdated(
  subscription: Stripe.Subscription,
  deleted = false,
) {
  // update subscription (overrides whatever subscription they have currently)
  const prod = subscription.items.data[0].plan.product;
  await supabase.from("stripe").update({
    active_subscription_product: deleted ? null : prod,
    active_subscription_status: deleted ? null : subscription.status,
  }).eq(
    "stripe_customer_id",
    subscription.customer,
  );
}

async function onCheckoutComplete(session: Stripe.Session) {
  // skip if checkout session is recurring
  // const items: Stripe[] = session.line_items.data
  //
  // const { data } = await supabase.from("stripe").select(
  //   "one_time_payment_products",
  // ).eq(
  //   "stripe_customer_id",
  //   subscription.customer,
  // ).single();
  // prods = data?.one_time_payment_products
  // // update subscription (overrides whatever subscription they have currently)
  // const prod = subscription.items.data[0].plan.product;
  // await supabase.from("stripe").update({
  //   active_subscription_product: prod,
  //   active_subscription_status: subscription.status,
  // }).eq(
  //   "stripe_customer_id",
  //   subscription.customer,
  // );
}
