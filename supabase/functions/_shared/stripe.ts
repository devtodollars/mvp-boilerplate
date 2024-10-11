import Stripe from "stripe";
import { Tables } from "../types_db.ts";
import {
  createOrRetrieveCustomer,
  upsertPriceRecords,
  upsertProductRecords,
} from "./supabase.ts";
import { calculateTrialEndUnixTimestamp } from "./utils.ts";
import { User } from "supabase";

export const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  httpClient: Stripe.createFetchHttpClient(),
  // https://github.com/stripe/stripe-node#configuration
  // https://stripe.com/docs/api/versioning
  apiVersion: "2024-06-20",
});

type Price = Tables<"prices">;

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

export async function checkoutWithStripe(
  price: Price,
  user: User,
  returnUrl: string,
): Promise<string> {
  // Retrieve or create the customer in Stripe
  let customer: string;
  try {
    customer = await createOrRetrieveCustomer({
      uuid: user?.id || "",
      email: user?.email || "",
    });
  } catch (err) {
    console.error(err);
    throw new Error("Unable to access customer record.");
  }

  let params: Stripe.Checkout.SessionCreateParams = {
    allow_promotion_codes: true,
    billing_address_collection: "required",
    customer,
    customer_update: {
      address: "auto",
    },
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    cancel_url: returnUrl || undefined,
    success_url: returnUrl || undefined,
  };

  console.log(
    "Trial end:",
    calculateTrialEndUnixTimestamp(price.trial_period_days),
  );
  if (price.type === "recurring") {
    params = {
      ...params,
      mode: "subscription",
      subscription_data: {
        trial_end: calculateTrialEndUnixTimestamp(price.trial_period_days),
      },
    };
  } else if (price.type === "one_time") {
    params = {
      ...params,
      mode: "payment",
    };
  }

  // Create a checkout session in Stripe
  let session;
  try {
    session = await stripe.checkout.sessions.create(params);
  } catch (err) {
    console.error(err);
    throw new Error("Unable to create checkout session.");
  }

  // Instead of returning a Response, just return the url or error.
  const url = session.url;
  if (url) {
    return url;
  } else {
    throw new Error("Unable to create checkout session.");
  }
}

export async function createStripePortal(
  user: User,
  returnUrl: string,
): Promise<string> {
  let customer;
  try {
    customer = await createOrRetrieveCustomer({
      uuid: user.id || "",
      email: user.email || "",
    });
  } catch (err) {
    console.error(err);
    throw new Error("Unable to access customer record.");
  }

  if (!customer) {
    throw new Error("Could not get customer.");
  }

  try {
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: returnUrl,
    });
    if (!url) {
      throw new Error("Could not create billing portal");
    }
    return url;
  } catch (err) {
    console.error(err);
    throw new Error("Could not create billing portal");
  }
}

export async function initPricesAndProducts() {
  console.log("Initializing products and prices");
  try {
    const [prodRes, priceRes] = await Promise.all([
      stripe.products.list({ active: true }),
      stripe.prices.list({ active: true }),
    ]);

    // Only use prices from active products
    const products = prodRes.data;
    const prodIds = products.map((p: Stripe.Product) => p.id);
    const prices = priceRes.data.filter((p: Stripe.Price) =>
      prodIds.includes(p.product),
    );

    await upsertProductRecords(products);
    await upsertPriceRecords(prices);
  } catch (e) {
    console.error(e);
  }
}
