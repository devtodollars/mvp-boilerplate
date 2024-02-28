import Stripe from "stripe";

export const stripe = Stripe(Deno.env.get("STRIPE_SK")!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2022-08-01",
});
