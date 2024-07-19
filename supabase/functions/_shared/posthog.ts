import { PostHog } from "posthog";

export const posthog = new PostHog(Deno.env.get("POSTHOG_CLIENT_KEY") || "", {
  flushAt: 1,
  flushInterval: 0,
});
