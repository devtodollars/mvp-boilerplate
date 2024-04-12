---
sidebar_position: 1
---
# Supabase Local Development

## Why?

* Safer (it's sketchy to work off of production)
  * Test database changes without affecting production
  * Test edge functions without deploying to production
* Faster
* Works Offline
* [And more...](https://supabase.com/docs/guides/cli/local-development#why-develop-locally)

## Setup

1. If you haven't already, [setup Supabase](./)
2. Install [Docker Desktop](https://docs.docker.com/desktop)
3. Copy `.env.example` into `.env.local` and `.env`

```bash
cp supabase/.env.example supabase/.env.local
cp supabase/.env.example supabase/.env
```

4. Start the Supabase server

```bash
supabase start
```

5. Start the functions server (in new terminal)

```bash
supabase functions serve --env-file supabase/.env.local
```

:::info
You can run change the `--env-file` to `supabase/.env` to use the production environment variables. Useful when testing out [Stripe](../payments.md) production env in local supabase env.
:::

6. Run the flutter web app (in new terminal)

```bash
cd flutter
flutter run --dart-define-from-file=env.local.json -d chrome
```

:::info
You can access a local version of the Supabase dashboard by visitng [http://localhost:54323/](http://localhost:54323/)
:::

## Pulling Prod Changes to Local Env

1. Make changes to the cloud Supabase dashboard
2. Pull changes from the cloud to local environment

```bash
supabase db pull
```

3. Push migrations to the local database so you have them in your local environment

```bash
supabase migrations up
```

:::info
If you're making small, non-destructive changes (e.g. adding a column to a table) this is my recommended approach when making changes to the database&#x20;
:::

## Pushing Local Changes to Prod Env

1. Make database changes to the [local supabase dashboard](http://localhost:54323/) or wherever
2. Create a new migration by running

```bash
supabase db diff -f insert_good_migration_name_here
```

3. Review the generated migration file and ensure all the changes expected changes
4. Reset your local database to ensure the migration works as expected

```bash
supabase db reset
```

5. Once you’ve tested everything now you can push your migrations

```bash
supabase db push
```

:::warning
`supabase db push` will update the production environment. REALLY make sure it doesn't break anything before you run this command.
:::

## Helpful Links

* [https://supabase.com/docs/guides/cli/local-development](https://supabase.com/docs/guides/cli/local-development)
