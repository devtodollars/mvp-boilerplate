import * as Sentry from '@sentry/nextjs';
import { FunctionsHttpError } from '@supabase/supabase-js';

// Query parameters that can carry secrets or personal data. Auth links put the
// one-time `code`/`token` in the URL, and the auth routes put error messages in
// `toast_description`. Their values are replaced before an event leaves the app.
const SENSITIVE_PARAMS = [
  'code',
  'token',
  'token_hash',
  'access_token',
  'refresh_token',
  'error_description',
  'toast_description',
  'email'
];

export function scrubUrl(url: string): string {
  const queryStart = url.indexOf('?');
  if (queryStart === -1) return url;
  const base = url.slice(0, queryStart);
  const [query, hash = ''] = url.slice(queryStart + 1).split('#', 2);
  const params = new URLSearchParams(query);
  let changed = false;
  for (const key of SENSITIVE_PARAMS) {
    if (params.has(key)) {
      params.set(key, '[Filtered]');
      changed = true;
    }
  }
  if (!changed) return url;
  return `${base}?${params.toString()}${hash ? `#${hash}` : ''}`;
}

function scrubEvent(event: Sentry.ErrorEvent): Sentry.ErrorEvent {
  if (event.request?.url) event.request.url = scrubUrl(event.request.url);
  if (typeof event.request?.query_string === 'string') {
    event.request.query_string = scrubUrl(
      `?${event.request.query_string}`
    ).slice(1);
  }
  return event;
}

function scrubBreadcrumb(breadcrumb: Sentry.Breadcrumb): Sentry.Breadcrumb {
  const data = breadcrumb.data;
  if (data) {
    for (const key of ['url', 'from', 'to']) {
      if (typeof data[key] === 'string') data[key] = scrubUrl(data[key]);
    }
  }
  return breadcrumb;
}

// Shared by the browser, Node.js and edge `Sentry.init` calls.
export const sharedSentryOptions = {
  // Sentry is disabled when the DSN is not set
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Tags events, e.g. "development" or "production". When unset, Sentry uses
  // Vercel's environment (production/preview) or NODE_ENV.
  environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT,
  // Capture 100% of transactions in development, 10% in production
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  // Sentry 11 collects cookies, request/response bodies, local variables and
  // user details by default. Turn off everything that can hold passwords,
  // session tokens or personal data. The signed-in user is identified by their
  // Supabase id only (see setSentryUser), which `userInfo: false` still allows.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpBodies: [],
    urlQueryParams: { deny: SENSITIVE_PARAMS },
    stackFrameVariables: false,
    databaseQueryData: false
  },
  // Browser noise that is not a bug in this app and would use up the quota
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    'AbortError'
  ],
  // Errors thrown by browser extensions injected into the page
  denyUrls: [
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    /^safari-(web-)?extension:\/\//
  ],
  // Span URLs are filtered by dataCollection.urlQueryParams above
  beforeSend: scrubEvent,
  beforeBreadcrumb: scrubBreadcrumb
} satisfies Sentry.BrowserOptions;

// The path the browser sends events to, so ad blockers can't drop them. The
// server forwards them to Sentry (serveTunnelIntegration). It is excluded from
// the proxy matcher in proxy.ts.
export const SENTRY_TUNNEL_PATH = '/monitoring';

// Identifies the signed-in user on events by Supabase id only, never email.
export function setSentryUser(user: { id: string } | null | undefined) {
  Sentry.setUser(user ? { id: user.id } : null);
}

// Reports a failed `get_stripe_url` call from the browser. A
// FunctionsHttpError means the function ran and returned an error, which the
// function already reports itself, so only failures that never reached it
// (network, CORS, function not deployed) are reported here.
export function reportBillingError(
  error: unknown,
  action: 'checkout' | 'billing_portal'
) {
  if (error instanceof FunctionsHttpError) return;
  Sentry.captureException(error, { tags: { billing_action: action } });
}

// Auth link failures the user causes (an expired or reused link, or a link
// opened in a different browser than the one that requested it). Anything else
// from the auth routes means a misconfiguration, e.g. a wrong redirect URL or
// email template, so nobody can verify their email or reset their password.
const EXPECTED_AUTH_LINK_ERRORS = new Set([
  'otp_expired',
  'bad_code_verifier',
  'pkce_code_verifier_not_found',
  'validation_failed',
  'flow_state_expired',
  'flow_state_not_found'
]);

// Reports an unexpected failure from an auth redirect route.
export function reportAuthLinkError(
  error: unknown,
  route: 'auth_callback' | 'reset_password'
) {
  const code = (error as { code?: string } | null)?.code;
  if (code && EXPECTED_AUTH_LINK_ERRORS.has(code)) return;
  Sentry.captureException(error, {
    tags: { auth_route: route, auth_error_code: code ?? 'unknown' }
  });
}

// An error from the `error_code`/`error_description` query parameters Supabase
// Auth adds when it redirects back after a failed link.
export function authRedirectError(params: URLSearchParams): Error | null {
  const description = params.get('error_description');
  if (!description) return null;
  return Object.assign(new Error(description), {
    code: params.get('error_code') ?? undefined
  });
}
