---
sidebar_position: 4
---
# Release (Supabase Github App)
We run our deployments following best practices from [Supabase Managing Environments](https://supabase.com/docs/guides/cli/managing-environments).
![](../assets/supabase-managing-env.png)

Then, we follow [database branching](https://supabase.com/docs/guides/platform/branching) to handle the deployments

## Deployment Commands

### Deploy Supabase functions

```bash
supabase functions deploy --import-map supabase/functions/deno.json
```

### Set supabase secrets from .env file

```bash
supabase secrets set --env-file .env
```