import { supabase } from "../_shared/supabase.ts";
import { posthog } from "../_shared/posthog.ts";

const XMRCHECKOUT_WEBHOOK_SECRET = Deno.env.get("XMRCHECKOUT_WEBHOOK_SECRET")!;

interface XMRInvoice {
  id: string;
  address: string;
  amount_xmr: string;
  status: string;
  metadata?: {
    user_id?: string;
    product_id?: string;
    product_name?: string;
  };
  created_at: string;
  expires_at: string;
  detected_at: string | null;
  confirmed_at: string | null;
}

interface XMRWebhookEvent {
  event: "invoice.confirmed" | "invoice.expired" | "invoice.created" | "invoice.payment_detected";
  invoice: XMRInvoice;
}

Deno.serve(async (req) => {
  // Verify webhook signature
  const webhookSecret = req.headers.get("X-Webhook-Secret");
  if (webhookSecret !== XMRCHECKOUT_WEBHOOK_SECRET) {
    console.error("Invalid webhook secret");
    return new Response("Unauthorized", { status: 401 });
  }

  let event: XMRWebhookEvent;
  try {
    event = await req.json();
    console.log("📦 Raw webhook payload:", JSON.stringify(event, null, 2));
    console.log(`🔔 XMR Webhook received: ${event.event}`);
  } catch (err) {
    console.error(`❌ Error parsing webhook: ${err.message}`);
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.event) {
      case "invoice.confirmed": {
        await handleInvoiceConfirmed(event);
        break;
      }
      case "invoice.expired": {
        await handleInvoiceExpired(event);
        break;
      }
      case "invoice.payment_detected": {
        await handlePaymentDetected(event);
        break;
      }
      case "invoice.created": {
        // Invoice created, no action needed
        console.log(`Invoice created: ${event.invoice.id}`);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.event}`);
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    return new Response("Webhook handler failed", { status: 400 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function handleInvoiceConfirmed(event: XMRWebhookEvent) {
  const invoice = event.invoice;
  const userId = invoice.metadata?.user_id;
  const productId = invoice.metadata?.product_id;

  if (!userId) {
    throw new Error("Missing user_id in invoice metadata");
  }

  // Update xmr_invoices status
  const { error: updateError } = await supabase
    .from("xmr_invoices")
    .update({
      status: "confirmed",
      confirmed_at: new Date().toISOString(),
    })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("Failed to update invoice:", updateError);
  }

  // Get product details for subscription
  const { data: product } = await supabase
    .from("xmr_products")
    .select()
    .eq("id", productId)
    .single();

  // Calculate subscription period
  const now = new Date();
  const periodEnd = new Date(now);
  if (product?.interval === "year") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }

  // Create XMR-based subscription ID
  const subscriptionId = `xmr_sub_${invoice.id}`;

  // Upsert subscription in subscriptions table
  const { error: subscriptionError } = await supabase
    .from("subscriptions")
    .upsert({
      id: subscriptionId,
      user_id: userId,
      status: "active",
      metadata: {
        payment_method: "xmr",
        xmr_invoice_id: invoice.id,
        xmr_product_id: productId,
        amount_xmr: invoice.amount_xmr,
      },
      cancel_at_period_end: false,
      created: now.toISOString(),
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });

  if (subscriptionError) {
    throw new Error(`Subscription upsert failed: ${subscriptionError.message}`);
  }

  console.log(
    `Created/updated XMR subscription [${subscriptionId}] for user [${userId}]`
  );

  posthog.capture({
    distinctId: userId,
    event: "xmr subscription activated",
    properties: {
      invoice_id: invoice.id,
      product_id: productId,
      product_name: invoice.metadata?.product_name,
      amount_xmr: invoice.amount_xmr,
      subscription_id: subscriptionId,
    },
  });
}

async function handlePaymentDetected(event: XMRWebhookEvent) {
  const invoice = event.invoice;

  // Update xmr_invoices status to show payment is being confirmed
  const { error: updateError } = await supabase
    .from("xmr_invoices")
    .update({ status: "payment_detected" })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("Failed to update invoice:", updateError);
  }

  console.log(`Payment detected for invoice: ${invoice.id}`);

  if (invoice.metadata?.user_id) {
    posthog.capture({
      distinctId: invoice.metadata.user_id,
      event: "xmr payment detected",
      properties: {
        invoice_id: invoice.id,
        product_id: invoice.metadata.product_id,
      },
    });
  }
}

async function handleInvoiceExpired(event: XMRWebhookEvent) {
  const invoice = event.invoice;

  // Update xmr_invoices status
  const { error: updateError } = await supabase
    .from("xmr_invoices")
    .update({ status: "expired" })
    .eq("id", invoice.id);

  if (updateError) {
    console.error("Failed to update expired invoice:", updateError);
  }

  console.log(`Invoice expired: ${invoice.id}`);

  if (invoice.metadata?.user_id) {
    posthog.capture({
      distinctId: invoice.metadata.user_id,
      event: "xmr invoice expired",
      properties: {
        invoice_id: invoice.id,
        product_id: invoice.metadata.product_id,
      },
    });
  }
}
