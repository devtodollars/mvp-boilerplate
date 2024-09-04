---
sidebar_position: 1
---

# Setup

1. Create a project in [Supabase](https://supabase.com/)

:::info
Make sure to save the DB password somewhere safe. you'll need it in the future
:::

2. [Install supabase cli](https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli) and link the created project (below installation is for Mac)

```bash
brew install supabase/tap/supabase
supabase link
```

:::info
Make sure you are in your project directory before you run `supabase link`
:::

3. Run the below commands to initialize the database and deploy edge functions

```bash
supabase db push
supabase functions deploy --import-map supabase/functions/deno.json
```

4. (OPTIONAL) [Setup Supabase local development](local-development/pull-changes.md)
