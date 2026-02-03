import { clientRequestHandlerWithUser } from "../_shared/request.ts";
import { supabase } from "../_shared/supabase.ts";
import { posthog } from "../_shared/posthog.ts";

const XMRCHECKOUT_API_URL = Deno.env.get("XMRCHECKOUT_API_URL")!;
const XMRCHECKOUT_API_KEY = Deno.env.get("XMRCHECKOUT_API_KEY")!;

interface XMRCheckoutInvoiceResponse {
  id: string;
  invoice_url: string;
  address: string;
  amount_xmr: string;
  status: string;
}

clientRequestHandlerWithUser(async (req, user) => {
  const { product_id, return_url } = await req.json();

  if (!product_id) {
    throw new Error("product_id is required");
  }

  // Lookup product from xmr_products table
  const { data: product, error: productError } = await supabase
    .from("xmr_products")
    .select()
    .eq("id", product_id)
    .single();

  if (productError || !product) {
    throw new Error(`Product not found: ${productError?.message || "unknown"}`);
  }

  // Create invoice with xmrcheckout API
  const invoiceResponse = await fetch(`${XMRCHECKOUT_API_URL}/api/core/invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `ApiKey ${XMRCHECKOUT_API_KEY}`,
    },
    body: JSON.stringify({
      amount_xmr: product.amount_xmr,
      description: `${product.name} subscription`,
      metadata: {
        user_id: user.id,
        product_id: product.id,
        product_name: product.name,
      },
      checkout_continue_url: return_url,
    }),
  });

  if (!invoiceResponse.ok) {
    const errorText = await invoiceResponse.text();
    throw new Error(`Failed to create XMR invoice: ${errorText}`);
  }

  const invoice: XMRCheckoutInvoiceResponse = await invoiceResponse.json();

  // Store invoice in xmr_invoices table
  const { error: insertError } = await supabase.from("xmr_invoices").insert({
    id: invoice.id,
    user_id: user.id,
    product_id: product.id,
    amount_xmr: product.amount_xmr,
    status: "pending",
    address: invoice.address,
  });

  if (insertError) {
    console.error("Failed to store invoice:", insertError);
    // Continue anyway - the webhook will handle the subscription
  }

  posthog.capture({
    distinctId: user.id,
    event: "user starts xmr checkout",
    properties: {
      product_id: product.id,
      product_name: product.name,
      amount_xmr: product.amount_xmr,
      invoice_id: invoice.id,
    },
  });

  return new Response(
    JSON.stringify({
      redirect_url: invoice.invoice_url,
      invoice_id: invoice.id,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
});
