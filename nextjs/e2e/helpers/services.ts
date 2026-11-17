import { createHmac } from 'node:crypto';
import postgres from 'postgres';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { expect } from '@playwright/test';
import {
  FUNCTIONS_URL,
  LOCAL,
  PASSWORD,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET
} from './env';
import type { Database } from '../../types_db';

// ---------- Postgres (direct, as superuser, for assertions only) ----------

export const sql = postgres(LOCAL.dbUrl, { max: 2, onnotice: () => {} });

// ---------- Supabase clients ----------

const noPersist = { auth: { persistSession: false, autoRefreshToken: false } };

export const admin = createClient<Database>(
  LOCAL.supabaseUrl,
  LOCAL.serviceRoleKey,
  noPersist
);

export const anonClient = () =>
  createClient<Database>(LOCAL.supabaseUrl, LOCAL.anonKey, noPersist);

/** Creates an already-confirmed user and returns a client signed in as them. */
export async function createSignedInUser(
  email: string
): Promise<{ id: string; client: SupabaseClient<Database> }> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true
  });
  if (error) throw error;
  const client = anonClient();
  const { error: signInError } = await client.auth.signInWithPassword({
    email,
    password: PASSWORD
  });
  if (signInError) throw signInError;
  return { id: data.user.id, client };
}

// ---------- Mailpit (local inbox at :54324) ----------

type MailSummary = { ID: string; Subject: string; Created: string };

/** Waits for the newest email to `to` (optionally newer than `after`) and returns the first auth link in it. */
export async function waitForAuthLink(
  to: string,
  opts: { after?: Date; subject?: RegExp } = {}
): Promise<string> {
  let link: string | undefined;
  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${LOCAL.mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`
        );
        const { messages = [] } = (await res.json()) as {
          messages: MailSummary[];
        };
        const msg = messages.find(
          (m) =>
            (!opts.after || new Date(m.Created) > opts.after) &&
            (!opts.subject || opts.subject.test(m.Subject))
        );
        if (!msg) return undefined;
        const full = (await (
          await fetch(`${LOCAL.mailpitUrl}/api/v1/message/${msg.ID}`)
        ).json()) as { HTML: string; Text: string };
        const body = full.HTML || full.Text;
        link = body
          .match(/href="([^"]*\/auth\/v1\/verify[^"]*)"/)?.[1]
          ?.replace(/&amp;/g, '&');
        return link;
      },
      { timeout: 20_000, message: `auth email to ${to}` }
    )
    .toBeTruthy();
  return link!;
}

// ---------- Stripe (test mode, REST, no SDK) ----------

function form(params: Record<string, string | number | boolean>): string {
  return new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped Stripe REST responses
export async function stripeApi<T = any>(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const qs = method === 'GET' && Object.keys(params).length ? `?${form(params)}` : '';
  const res = await fetch(`https://api.stripe.com/v1${path}${qs}`, {
    method,
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: method === 'GET' ? undefined : form(params)
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`Stripe ${method} ${path}: ${body?.error?.message}`);
  return body as T;
}

/** Builds a `Stripe-Signature` header the same way Stripe does (v1 scheme). */
export function signStripePayload(payload: string, secret = STRIPE_WEBHOOK_SECRET) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac('sha256', secret).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${v1}`;
}

/** Posts a signed Stripe event to the local stripe_webhook function. */
export async function sendStripeEvent(type: string, object: object) {
  const payload = JSON.stringify({
    id: `evt_e2e_${Date.now()}`,
    object: 'event',
    api_version: '2024-06-20',
    created: Math.floor(Date.now() / 1000),
    type,
    data: { object },
    livemode: false,
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null }
  });
  const res = await fetch(`${FUNCTIONS_URL}/stripe_webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signStripePayload(payload)
    },
    body: payload
  });
  return { status: res.status, text: await res.text() };
}

/** Calls get_stripe_url as a signed-in user, like the frontends do. */
export async function getStripeUrl(
  client: SupabaseClient<Database>,
  body: { price?: string; return_url: string }
) {
  return client.functions.invoke<{ redirect_url?: string }>('get_stripe_url', {
    body
  });
}
