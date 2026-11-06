import * as Sentry from "sentry";

// Sentry is disabled when the DSN is not set
Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  // Capture 10% of transactions for performance monitoring
  tracesSampleRate: 0.1,
});

// Set region and execution id as custom tags
// https://supabase.com/docs/guides/functions/examples/sentry-monitoring
Sentry.setTag("region", Deno.env.get("SB_REGION") ?? "");
Sentry.setTag("execution_id", Deno.env.get("SB_EXECUTION_ID") ?? "");

// Reports an error to Sentry and waits for it to be sent, since the edge
// runtime may shut down the function as soon as the response is returned.
export async function captureException(error: unknown) {
  Sentry.captureException(error);
  await Sentry.flush(2000);
}

export { Sentry };
