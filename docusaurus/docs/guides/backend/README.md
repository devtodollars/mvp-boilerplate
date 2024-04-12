# Backend (Supabase)

## Setup

1. Create a project in [Supabase](https://supabase.com/)

:::info
Make sure to save the DB password somewhere safe. you'll need it in the future
:::

2. Go to Project Settings > API. Then copy the project url and anon key into the variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` respectively in the `env.json` file.

```
{
  "SUPABASE_URL": "https://crnytzptlghehxsarjxm.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnl0enB0bGdoZWh4c2FyanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkyMjQxNjgsImV4cCI6MjAyNDgwMDE2OH0.UW1dHRt4hGF6uCdPXimxv0Ggwq5uJ1WoQuCZ1_ixmCU"
}
```

3. [Install supabase cli](https://supabase.com/docs/guides/cli/getting-started#installing-the-supabase-cli) and link the created project (below installation is for Mac)

```bash
brew install supabase/tap/supabase
supabase link
```

:::info
Make sure you are in your project directory before you run `supabase link`
:::

4. Run the below commands to initialize the database and deploy edge functions

```bash
supabase db push
supabase functions deploy
```

5. Test your flutter app that is now connected to your own backend

```bash
flutter run --dart-define-from-file=env.json
```

5. (OPTIONAL) [Setup Supabase local development](supabase-local-development.md)

## Supabase Project Structure

* `/supabase/migrations` -> Changes to the database go here to sync [local development](supabase-local-development.md) with production environment
* `/supabase/functions` -> This is the serverless backend that is run through [Supabase edge functions](https://supabase.com/docs/guides/functions)
* Configuration files:
  * `/supabase/.env` -> Environment variables for the production database
  * `/supabase/.env.local` -> Environment variables for the local database

## Helpful Links

* [https://supabase.com/docs](https://supabase.com/docs)

