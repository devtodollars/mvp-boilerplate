import Stripe from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { processWebhookRequest } from "../_shared/stripe.ts";
import { supabase } from "../_shared/supabase.ts";
import { stripe } from "../_shared/stripe.ts";
import { posthog } from "../_shared/posthog.ts";
import { sendEmail } from "../_shared/postmark.ts";

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
  const prods = await getActiveProducts(subscription.customer);
  const subscriptionItems = subscription.items.data;
  const validStatuses = ["incomplete", "trialing", "active"];
  for (const item of subscriptionItems) {
    const prod = item.plan.product;

    if (deleted || !validStatuses.includes(subscription.status)) {
      // removes product from purchased products
      const i = prods.indexOf(prod);
      if (i !== -1) prods.splice(i, 1);
    } else if (!prods.includes(prod)) {
      prods.push(prod);
    }
  }
  // updates purchased_products
  await supabase.from("stripe").update({
    active_products: prods,
  }).eq("stripe_customer_id", subscription.customer);
}

async function onCheckoutComplete(session: Stripe.Session) {
  const prods = await getActiveProducts(session.customer);
  const { data: lineItems } = await stripe.checkout.sessions.listLineItems(
    session.id,
  );

  for (const item of lineItems) {
    const prod = item.price.product;
    // skip if product is subscription or already purchased
    if (item.mode === "subscription" || prods.includes(prod)) continue;
    prods.push(prod);
  }
  const { data: row } = await supabase.from("stripe").update({
    active_products: prods,
  }).eq("stripe_customer_id", session.customer).select().maybeSingle();

  // Sends email based on purchase
  const checkoutProducts = lineItems.map((i: Stripe.LineItem) =>
    i.price.product
  );
  await sendPurchaseEmail(checkoutProducts, session.customer_details.email);

  // posthog capture
  if (!row) return;
  posthog.capture({
    distinctId: row.user_id,
    event: "user completes checkout",
    properties: {
      prods,
      $set: {
        "stripe_customer_id": row.stripe_customer_id,
      },
    },
  });
}

async function getActiveProducts(customer: string): Promise<string[]> {
  const { data } = await supabase.from("stripe").select(
    "active_products",
  ).eq(
    "stripe_customer_id",
    customer,
  ).single();
  const purchasedProds: string[] = data?.active_products || [];
  return purchasedProds;
}

async function sendPurchaseEmail(products: string[], to: string) {
  // TODO: update this function based on your emailing needs
  const product = products[0];
  let template = "";
  if (product === "prod_PfRVCVqv8fBrxN") {
    template = "paid-docs-support";
  }
  if (template) {
    await sendEmail({ to, template });
  }
}
