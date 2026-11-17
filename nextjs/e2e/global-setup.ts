import { FUNCTIONS_URL, LOCAL } from './helpers/env';

/**
 * Warms the edge functions before any test runs. The local handle_user_modify
 * trigger (supabase/seed.sql) calls on_user_modify through pg_net with a 1s
 * timeout, and a cold function (first request after `functions serve` starts or
 * a file changes) takes longer than that to compile, so A2 would flake.
 */
export default async function globalSetup() {
  const call = async (name: string, init: RequestInit) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await fetch(`${FUNCTIONS_URL}/${name}`, {
          ...init,
          signal: AbortSignal.timeout(60_000)
        });
        if (res.status < 500) return;
      } catch {
        /* retry */
      }
    }
    throw new Error(
      `Edge function ${name} is not responding. Is tests/start-stack.sh running?`
    );
  };

  await Promise.all([
    call('on_user_modify', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOCAL.serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      // UPDATE with no sign-in change: loads the function, sends no event.
      body: JSON.stringify({
        type: 'UPDATE',
        record: { id: 'warmup', email: 'warmup@example.com', last_sign_in_at: null },
        old_record: { id: 'warmup', last_sign_in_at: null }
      })
    }),
    call('stripe_webhook', { method: 'POST', headers: { 'Stripe-Signature': 't=1,v1=x' }, body: '{}' }),
    call('get_stripe_url', { method: 'OPTIONS' })
  ]);
}
