import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Default keys of every `supabase start` stack (public demo JWTs, not secrets).
export const LOCAL = {
  supabaseUrl: process.env.E2E_SUPABASE_URL ?? 'http://127.0.0.1:54321',
  dbUrl:
    process.env.E2E_DB_URL ??
    'postgresql://postgres:postgres@127.0.0.1:54322/postgres',
  mailpitUrl: process.env.E2E_MAILPIT_URL ?? 'http://127.0.0.1:54324',
  anonKey:
    process.env.E2E_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  serviceRoleKey:
    process.env.E2E_SERVICE_ROLE_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
};

export const FUNCTIONS_URL = `${LOCAL.supabaseUrl}/functions/v1`;

// The edge functions read their secrets from supabase/.env.local; the tests
// read the same file so webhook signatures and Stripe calls line up.
function readFunctionEnv(): Record<string, string> {
  try {
    const raw = readFileSync(
      resolve(__dirname, '../../../supabase/.env.local'),
      'utf8'
    );
    return Object.fromEntries(
      raw
        .split('\n')
        .filter((l) => /^[A-Z_]+=/.test(l))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i), l.slice(i + 1).replace(/^"|"$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

const fnEnv = readFunctionEnv();

export const STRIPE_SECRET_KEY =
  process.env.STRIPE_SECRET_KEY ?? fnEnv.STRIPE_SECRET_KEY ?? '';
export const STRIPE_WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SIGNING_SECRET ??
  fnEnv.STRIPE_WEBHOOK_SIGNING_SECRET ??
  '';

if (/^(sk|rk)_live_/.test(STRIPE_SECRET_KEY)) {
  throw new Error('Refusing to run e2e tests with a LIVE Stripe key.');
}

/** True when a real Stripe test-mode key is configured. */
export const HAS_STRIPE =
  /^(sk|rk)_test_/.test(STRIPE_SECRET_KEY) &&
  !STRIPE_SECRET_KEY.includes('placeholder');

export const uniqueEmail = (tag: string) =>
  `e2e-${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

export const PASSWORD = 'Sup3r-Secret-Pw!';
