import { posthog } from "../_shared/posthog.ts";

Deno.serve(async (req) => {
  let { record, old_record, type } = await req.json();
  record = record || old_record;

  // deno-lint-ignore no-explicit-any
  const properties: Record<string, any> = { type };
  properties["$set"] = properties["$set"] || {};
  properties["$set"].email = record.email || undefined;
  properties["$set"].created_at = record.created_at;
  properties["$set"].last_sign_in_at = record.last_sign_in_at;

  posthog.capture({
    distinctId: record.id,
    event: "user modify auth table",
    properties: properties,
  });

  return new Response(null);
});
