import { initPricesAndProducts } from "../_shared/stripe.ts";
import { initMoneroProducts } from "../_shared/supabase.ts";

const moneroFlag = Deno.args.includes("--monero");

await initPricesAndProducts();

if (moneroFlag) {
  await initMoneroProducts();
}
