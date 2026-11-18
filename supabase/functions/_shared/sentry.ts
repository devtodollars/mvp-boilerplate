import * as Sentry from "sentry";

// "development" locally (supabase/.env.local), "production" when deployed
// unless SENTRY_ENVIRONMENT is set in the function secrets.
const environment = Deno.env.get("SENTRY_ENVIRONMENT") || "production";

// Sentry is disabled when the DSN is not set
Sentry.init({
  dsn: Deno.env.get("SENTRY_DSN"),
  environment,
  // SENTRY_DEBUG=true logs what the SDK sends or drops to the function logs
  debug: Deno.env.get("SENTRY_DEBUG") === "true",
  // Which deploy an error came from. `pnpm supabase:deploy-functions` (in
  // nextjs/) sets it to the git commit before deploying.
  release: Deno.env.get("SENTRY_RELEASE") || undefined,
  // Capture every transaction locally, 10% in production
  tracesSampleRate: environment === "development" ? 1.0 : 0.1,
  // Dedupe drops an event identical to the previous one. One isolate serves
  // many requests, so it would drop repeats of the same failure from different
  // requests (e.g. every webhook after a signing-secret change) and Sentry
  // would undercount exactly what an alert needs to see.
  integrations: (defaults) => defaults.filter((i) => i.name !== "Dedupe"),
  // Requests carry Stripe payloads, auth tokens and user emails. Keep request
  // bodies, cookies, local variables and automatic user details out of events.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    stackFrameVariables: false,
    databaseQueryData: false,
  },
});

// Set region and execution id as custom tags
// https://supabase.com/docs/guides/functions/examples/sentry-monitoring
Sentry.setTag("region", Deno.env.get("SB_REGION") ?? "");
Sentry.setTag("execution_id", Deno.env.get("SB_EXECUTION_ID") ?? "");

type CaptureContext = {
  level?: Sentry.SeverityLevel;
  // Supabase user id only; never email
  userId?: string;
  tags?: Record<string, string>;
  // Groups events into one issue, e.g. every invalid webhook signature
  fingerprint?: string[];
};

// Reports an error to Sentry and waits for it to be sent, since the edge
// runtime may shut down the function as soon as the response is returned.
//
// Context goes on a scope for this event only: one isolate serves concurrent
// requests, so Sentry.setUser() would leak a user onto other requests' errors.
export async function captureException(
  error: unknown,
  context: CaptureContext = {},
) {
  Sentry.withScope((scope) => {
    if (context.level) scope.setLevel(context.level);
    if (context.userId) scope.setUser({ id: context.userId });
    if (context.tags) scope.setTags(context.tags);
    if (context.fingerprint) scope.setFingerprint(context.fingerprint);
    Sentry.captureException(error);
  });
  await Sentry.flush(2000);
}

export { Sentry };
