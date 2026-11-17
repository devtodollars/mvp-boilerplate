import { expect, test } from '@playwright/test';
import { uniqueEmail } from './helpers/env';
import { admin, anonClient, createSignedInUser, sql } from './helpers/services';

/**
 * Talks to the Data API directly (no browser) to check the schema, grants and
 * RLS policies the frontends rely on.
 */
test.describe('Database: grants, RLS and triggers', () => {
  let a: Awaited<ReturnType<typeof createSignedInUser>>;
  let b: Awaited<ReturnType<typeof createSignedInUser>>;

  test.beforeAll(async () => {
    a = await createSignedInUser(uniqueEmail('rls-a'));
    b = await createSignedInUser(uniqueEmail('rls-b'));
  });

  test('D1 every migration is applied', async () => {
    const applied = await sql`select version from supabase_migrations.schema_migrations`;
    const versions = applied.map((r) => r.version);
    expect(versions).toContain('20240717231009'); // init
    expect(versions).toContain('20261117000000'); // data API grants
    expect(versions).toContain('20261117000100'); // cascade user deletes
  });

  test('D2 handle_new_user trigger creates a public.users row per auth user', async () => {
    const rows = await sql`select id from public.users where id in (${a.id}, ${b.id})`;
    expect(rows).toHaveLength(2);
  });

  test('D3 anonymous visitors can read products and prices only', async () => {
    const anon = anonClient();
    const products = await anon.from('products').select('id');
    expect(products.error).toBeNull();
    const prices = await anon.from('prices').select('id');
    expect(prices.error).toBeNull();

    for (const table of ['users', 'subscriptions', 'checkout_sessions', 'customers'] as const) {
      const res = await anon.from(table).select('*');
      // either "permission denied" or no visible rows
      expect(res.error !== null || (res.data ?? []).length === 0, `anon read ${table}`).toBe(true);
    }
  });

  test('D4 a user sees only their own profile row', async () => {
    const own = await a.client.from('users').select('id');
    expect(own.error).toBeNull();
    expect(own.data!.map((r) => r.id)).toEqual([a.id]);

    const other = await a.client.from('users').select('id').eq('id', b.id);
    expect(other.data).toEqual([]);
  });

  test("D5 a user can update their own profile but not someone else's", async () => {
    const ok = await a.client.from('users').update({ full_name: 'Alice E2E' }).eq('id', a.id).select();
    expect(ok.error).toBeNull();
    expect(ok.data![0].full_name).toBe('Alice E2E');

    await a.client.from('users').update({ full_name: 'hacked' }).eq('id', b.id);
    const [bRow] = await sql`select full_name from public.users where id = ${b.id}`;
    expect(bRow.full_name).not.toBe('hacked');
  });

  test('D6 users cannot read the customers mapping or write billing tables', async () => {
    const customers = await a.client.from('customers').select('*');
    expect(customers.error?.message ?? '').toMatch(/permission denied/);

    const insertSub = await a.client.from('subscriptions').insert({
      id: 'sub_fake',
      user_id: a.id,
      status: 'active'
    } as never);
    expect(insertSub.error).not.toBeNull();

    const insertProduct = await a.client
      .from('products')
      .insert({ id: 'prod_fake', name: 'fake' } as never);
    expect(insertProduct.error).not.toBeNull();
  });

  test('D7 service role (edge functions) can write billing tables', async () => {
    const id = `prod_e2e_grant_${Date.now()}`;
    const ins = await admin.from('products').insert({ id, name: 'grant check', active: false });
    expect(ins.error).toBeNull();
    const del = await admin.from('products').delete().eq('id', id);
    expect(del.error).toBeNull();
  });

  test('D8 deleting an auth user cascades to public.users', async () => {
    // Fixed 2026-11-17 by migration 20261117000100_cascade_user_deletes.
    const c = await createSignedInUser(uniqueEmail('rls-c'));
    const { error } = await admin.auth.admin.deleteUser(c.id);
    expect(error).toBeNull();
    const rows = await sql`select id from public.users where id = ${c.id}`;
    expect(rows).toHaveLength(0);
  });
});
