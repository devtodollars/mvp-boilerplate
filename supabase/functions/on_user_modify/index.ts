import { posthog } from "../_shared/posthog.ts";
import { sendEmail } from "../_shared/postmark.ts";

Deno.serve(async (req) => {
  let { record, old_record, type } = await req.json();
  record = record || old_record;
  const email: string = record.email;

  let event: string | undefined;
  // deno-lint-ignore no-explicit-any
  const properties: Record<string, any> = { type };
  properties["$set"] = properties["$set"] || {};
  properties["$set"].email = email || undefined;
  properties["$set"].created_at = record.created_at;
  properties["$set"].last_sign_in_at = record.last_sign_in_at;

  if (type === "INSERT") {
    event = "user signs up";
    sendEmail({ to: email, template: "welcome" }); // TODO: update to your email needs
  } else if (
    type === "UPDATE" && record.last_sign_in_at !== old_record.last_sign_in_at
  ) {
    event = "user signs in";
  } else if (type === "DELETE") {
    event = "user deletes account";
  }

  if (event) {
    posthog.capture({
      distinctId: record.id,
      event,
      properties: properties,
    });
  }

  return new Response(null);
});
