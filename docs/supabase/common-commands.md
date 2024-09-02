---
sidebar_position: 4
---
# Common Commands

### Deploy Supabase functions

```bash
supabase functions deploy
```

### Set supabase secrets from .env file

```bash
supabase secrets set --env-file .env
```

### Start supabase local server

```bash
supabase start
```

### Start local Supabase functions

```bash
supabase functions serve --env-file .env --import-map supabase/functions/deno.json
```
