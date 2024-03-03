import { PostHog } from "npm:posthog-node@3.2.0";

export const posthog = new PostHog(Deno.env.get("POSTHOG_CLIENT_KEY") || "", {
  flushAt: 1,
  flushInterval: 0,
});
