---
sidebar_position: 5
---

# Common Commands

### Deploy Supabase functions

```bash
supabase functions deploy --import-map supabase/functions/deno.json
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

### Supabase database type sync with next js types.ts
* Get the most recent types from your supabase database on the server
```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public
```
* If you are running a database locally, get the types and sync it with the types_db.ts file in your nextjs folder by running the following command. Make sure that you are at root directory of your project: 
```bash
npx supabase gen types typescript --local --schema public > ./nextjs/types_db.ts
```
### Supabase migrations
If you were facing supabase migration problems, for example if your local database is out of sync with the server database, do the following for syncing the migration: 
* List migrations: 
```bash
supabase migrations list
```
* Repair a specific migration: 
```bash
supabase migration repair <migration-number> --status reverted
```
* Reset the database: 
```bash
supabase db reset
```
