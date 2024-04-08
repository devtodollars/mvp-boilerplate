import Stripe from "https://esm.sh/stripe@10.12.0?target=deno";
export const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: "2022-08-01",
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
