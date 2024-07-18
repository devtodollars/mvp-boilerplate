import Stripe from "stripe";
export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  apiVersion: "2024-06-20",
});

const cryptoProvider = Stripe.createSubtleCryptoProvider();

export const processWebhookRequest = async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  const body = await req.text();
  return await stripe.webhooks.constructEventAsync(
    body,
    signature!,
    Deno.env.get("STRIPE_WEBHOOK_SIGNING_SECRET")!,
    undefined,
    cryptoProvider,
  );
};
