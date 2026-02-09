import { createClient } from "supabase";
import { Database, Tables, TablesInsert } from "../types_db.ts";
import Stripe from "stripe";
import { stripe } from "./stripe.ts";
import { toDateTime } from "./utils.ts";

export const supabase = createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  {
    auth: {
      persistSession: false,
    },
  },
);

// Code below adapted from: https://github.com/vercel/nextjs-subscription-payments/blob/main/utils/supabase/admin.ts
// Change to control trial period length
const TRIAL_PERIOD_DAYS = 0;

const upsertProductRecord = async (product: Stripe.Product) =>
  await upsertProductRecords([product]);
const upsertProductRecords = async (products: Stripe.Product[]) => {
  const productData: Tables<"products">[] = products.map((product) => ({
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  }));

  const { error: upsertError } = await supabase
    .from("products")
    .upsert(productData);
  if (upsertError) {
    throw new Error(`Product insert/update failed: ${upsertError.message}`);
  }
  console.log(`Product inserted/updated: ${products.map((p) => p.id)}`);
};

const upsertPriceRecord = async (price: Stripe.Price) =>
  await upsertPriceRecords([price]);
const upsertPriceRecords = async (
  prices: Stripe.Price[],
  retryCount = 0,
  maxRetries = 3,
) => {
  const priceData: TablesInsert<"prices">[] = prices.map((price) => ({
    id: price.id,
    product_id: typeof price.product === "string" ? price.product : "",
    active: price.active,
    currency: price.currency.toUpperCase(),
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? TRIAL_PERIOD_DAYS,
    metadata: price.metadata,
  }));

  const { error: upsertError } = await supabase
    .from("prices")
    .upsert(priceData);

  if (upsertError?.message.includes("foreign key constraint")) {
    if (retryCount < maxRetries) {
      console.log(
        `Retry attempt ${retryCount + 1} for price ID: ${prices.map(
          (p) => p.id,
        )}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await upsertPriceRecords(prices, retryCount + 1, maxRetries);
    } else {
      throw new Error(
        `Price insert/update failed after ${maxRetries} retries: ${upsertError.message}`,
      );
    }
  } else if (upsertError) {
    throw new Error(`Price insert/update failed: ${upsertError.message}`);
  } else {
    console.log(`Price inserted/updated: ${prices.map((p) => p.id)}`);
  }
};

const deleteProductRecord = async (product: Stripe.Product) => {
  const { error: deletionError } = await supabase
    .from("products")
    .delete()
    .eq("id", product.id);
  if (deletionError) {
    throw new Error(`Product deletion failed: ${deletionError.message}`);
  }
  console.log(`Product deleted: ${product.id}`);
};

const deletePriceRecord = async (price: Stripe.Price) => {
  const { error: deletionError } = await supabase
    .from("prices")
    .delete()
    .eq("id", price.id);
  if (deletionError) {
    throw new Error(`Price deletion failed: ${deletionError.message}`);
  }
  console.log(`Price deleted: ${price.id}`);
};

const upsertCustomerToSupabase = async (uuid: string, customerId: string) => {
  const { error: upsertError } = await supabase
    .from("customers")
    .upsert([{ id: uuid, stripe_customer_id: customerId }]);

  if (upsertError) {
    throw new Error(
      `Supabase customer record creation failed: ${upsertError.message}`,
    );
  }

  return customerId;
};

const createCustomerInStripe = async (uuid: string, email: string) => {
  const customerData = { metadata: { supabaseUUID: uuid }, email: email };
  const newCustomer = await stripe.customers.create(customerData);
  if (!newCustomer) throw new Error("Stripe customer creation failed.");

  return newCustomer.id;
};

const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  // Check if the customer already exists in Supabase
  const { data: existingSupabaseCustomer, error: queryError } = await supabase
    .from("customers")
    .select("*")
    .eq("id", uuid)
    .maybeSingle();

  if (queryError) {
    throw new Error(`Supabase customer lookup failed: ${queryError.message}`);
  }

  // Retrieve the Stripe customer ID using the Supabase customer ID, with email fallback
  let stripeCustomerId: string | undefined;
  if (existingSupabaseCustomer?.stripe_customer_id) {
    const existingStripeCustomer = await stripe.customers.retrieve(
      existingSupabaseCustomer.stripe_customer_id,
    );
    stripeCustomerId = existingStripeCustomer.id;
  } else {
    // If Stripe ID is missing from Supabase, try to retrieve Stripe customer ID by email
    const stripeCustomers = await stripe.customers.list({ email: email });
    stripeCustomerId =
      stripeCustomers.data.length > 0 ? stripeCustomers.data[0].id : undefined;
  }

  // If still no stripeCustomerId, create a new customer in Stripe
  const stripeIdToInsert = stripeCustomerId
    ? stripeCustomerId
    : await createCustomerInStripe(uuid, email);
  if (!stripeIdToInsert) throw new Error("Stripe customer creation failed.");

  if (existingSupabaseCustomer && stripeCustomerId) {
    // If Supabase has a record but doesn't match Stripe, update Supabase record
    if (existingSupabaseCustomer.stripe_customer_id !== stripeCustomerId) {
      const { error: updateError } = await supabase
        .from("customers")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", uuid);

      if (updateError) {
        throw new Error(
          `Supabase customer record update failed: ${updateError.message}`,
        );
      }
      console.warn(
        `Supabase customer record mismatched Stripe ID. Supabase record updated.`,
      );
    }
    // If Supabase has a record and matches Stripe, return Stripe customer ID
    return stripeCustomerId;
  } else {
    console.warn(
      `Supabase customer record was missing. A new record was created.`,
    );

    // If Supabase has no record, create a new record and return Stripe customer ID
    const upsertedStripeCustomer = await upsertCustomerToSupabase(
      uuid,
      stripeIdToInsert,
    );
    if (!upsertedStripeCustomer) {
      throw new Error("Supabase customer record creation failed.");
    }

    return upsertedStripeCustomer;
  }
};

/**
 * Copies the billing details from the payment method to the customer object.
 */
const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod,
) => {
  //Todo: check this assertion
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  //@ts-ignore: typescript error for stripe type
  await stripe.customers.update(customer, { name, phone, address });
  const { error: updateError } = await supabase
    .from("users")
    .update({
      billing_address: { ...address },
      payment_method: { ...payment_method[payment_method.type] },
    })
    .eq("id", uuid);
  if (updateError) {
    throw new Error(`Customer update failed: ${updateError.message}`);
  }
};

const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false,
) => {
  // Get customer's UUID from mapping table.
  const { data: customerData, error: noCustomerError } = await supabase
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (noCustomerError) {
    throw new Error(`Customer lookup failed: ${noCustomerError.message}`);
  }

  const { id: uuid } = customerData!;

  const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["default_payment_method"],
  });
  // Upsert the latest status of the subscription object.
  const subscriptionData: TablesInsert<"subscriptions"> = {
    id: subscription.id,
    user_id: uuid,
    metadata: subscription.metadata,
    status: subscription.status,
    price_id: subscription.items.data[0].price.id,
    //TODO check quantity on subscription
    // @ts-ignore: ignore quantity doesnt exist
    quantity: subscription.quantity,
    cancel_at_period_end: subscription.cancel_at_period_end,
    cancel_at: subscription.cancel_at
      ? toDateTime(subscription.cancel_at).toISOString()
      : null,
    canceled_at: subscription.canceled_at
      ? toDateTime(subscription.canceled_at).toISOString()
      : null,
    current_period_start: toDateTime(
      subscription.current_period_start,
    ).toISOString(),
    current_period_end: toDateTime(
      subscription.current_period_end,
    ).toISOString(),
    created: toDateTime(subscription.created).toISOString(),
    ended_at: subscription.ended_at
      ? toDateTime(subscription.ended_at).toISOString()
      : null,
    trial_start: subscription.trial_start
      ? toDateTime(subscription.trial_start).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? toDateTime(subscription.trial_end).toISOString()
      : null,
  };

  const { error: upsertError } = await supabase
    .from("subscriptions")
    .upsert([subscriptionData]);
  if (upsertError) {
    throw new Error(
      `Subscription insert/update failed: ${upsertError.message}`,
    );
  }
  console.log(
    `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`,
  );

  // For a new subscription copy the billing details to the customer object.
  // NOTE: This is a costly operation and should happen at the very end.
  if (createAction && subscription.default_payment_method && uuid) {
    await copyBillingDetailsToCustomer(
      uuid,
      subscription.default_payment_method as Stripe.PaymentMethod,
    );
  }
};

const insertCheckoutSession = async (
  webhookSession: Stripe.Checkout.Session,
) => {
  // Get customer's UUID from mapping table.
  const { data: customerData, error: noCustomerError } = await supabase
    .from("customers")
    .select("id")
    .eq("stripe_customer_id", webhookSession.customer)
    .single();

  if (noCustomerError) {
    throw new Error(`Customer lookup failed: ${noCustomerError.message}`);
  }

  const checkoutSession = await stripe.checkout.sessions.retrieve(
    webhookSession.id,
    {
      expand: ["line_items"],
    },
  );

  const { id: uuid } = customerData!;

  // Upsert the latest status of the subscription object.
  const sessionData: TablesInsert<"checkout_sessions"> = {
    id: checkoutSession.id,
    user_id: uuid,
    metadata: checkoutSession.metadata,
    mode: checkoutSession.mode,
    status: checkoutSession.status,
    payment_status: checkoutSession.payment_status,
    price_id: checkoutSession.line_items.data[0].price.id,
    //TODO check quantity on subscription
    // @ts-ignore: ignore quantity doesnt exist
    quantity: checkoutSession.line_items.data[0].quantity,
    created: toDateTime(checkoutSession.created).toISOString(),
  };

  const { error: insertError } = await supabase
    .from("checkout_sessions")
    .insert(sessionData);
  if (insertError) {
    throw new Error(`Checkout session insert failed: ${insertError.message}`);
  }
  console.log(
    `Inserted checkout session [${checkoutSession.id}] for user [${uuid}]`,
  );
};

const initMoneroProducts = async () => {
  console.log("Initializing Monero products and prices");

  const moneroProducts = [
    {
      id: "xmr_prod_hobby",
      active: true,
      name: "Hobby",
      description: null,
      image: null,
      metadata: {},
      provider: "MONERO" as const,
    },
    {
      id: "xmr_prod_freelancer",
      active: true,
      name: "Freelancer",
      description: null,
      image: null,
      metadata: {},
      provider: "MONERO" as const,
    },
  ];

  const moneroPrices = [
    {
      id: "xmr_price_hobby_month",
      product_id: "xmr_prod_hobby",
      active: true,
      currency: "XMR",
      type: "recurring" as const,
      unit_amount: 0.0001,
      interval: "month" as const,
      interval_count: 1,
      trial_period_days: 0,
      metadata: {},
    },
    {
      id: "xmr_price_freelancer_month",
      product_id: "xmr_prod_freelancer",
      active: true,
      currency: "XMR",
      type: "recurring" as const,
      unit_amount: 0.1,
      interval: "month" as const,
      interval_count: 1,
      trial_period_days: 0,
      metadata: {},
    },
  ];

  const { error: productError } = await supabase
    .from("products")
    .upsert(moneroProducts);
  if (productError) {
    throw new Error(
      `Monero product insert/update failed: ${productError.message}`,
    );
  }
  console.log(
    `Monero products inserted/updated: ${moneroProducts.map((p) => p.id)}`,
  );

  const { error: priceError } = await supabase
    .from("prices")
    .upsert(moneroPrices);
  if (priceError) {
    throw new Error(
      `Monero price insert/update failed: ${priceError.message}`,
    );
  }
  console.log(
    `Monero prices inserted/updated: ${moneroPrices.map((p) => p.id)}`,
  );
};

export {
  createOrRetrieveCustomer,
  deletePriceRecord,
  deleteProductRecord,
  initMoneroProducts,
  insertCheckoutSession,
  manageSubscriptionStatusChange,
  upsertPriceRecord,
  upsertPriceRecords,
  upsertProductRecord,
  upsertProductRecords,
};
