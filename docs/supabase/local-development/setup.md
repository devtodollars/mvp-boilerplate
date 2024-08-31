---
sidebar_position: 1
---
# Setup

1. If you haven't already, [setup Supabase](../README.md)
2. Install [Docker Desktop](https://docs.docker.com/desktop)
3. Copy `.env.example` into `.env.local` and `.env`

```bash
cp .env.example .env.local
cp .env.example .env
```

4. Start the Supabase server

```bash
supabase start
```

5. Start the functions server (in new terminal)

```bash
supabase functions serve --env-file .env.local --import-file supabase/functions/deno.json
```

:::info
You can run change the `--env-file` to `.env` to use the production environment variables. Useful when testing out [Stripe](../../stripe/README.md) production env in local supabase env.
:::

:::info
You can access a local version of the Supabase dashboard by visitng [http://localhost:54323/](http://localhost:54323/)
:::