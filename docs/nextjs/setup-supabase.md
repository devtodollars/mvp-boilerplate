---
sidebar_position: 2
---
# Setup Supabase
## Setup backend
1. Setup [NextJS](quickstart.md) and [Supabase](../supabase/README.md)
2. Go to Project Settings > API. Then copy the project url and anon key into the variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` respectively in the `nextjs/.env` file.
```
NEXT_PUBLIC_SUPABASE_URL="https://crnytzptlghehxsarjxm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnl0enB0bGdoZWh4c2FyanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkyMjQxNjgsImV4cCI6MjAyNDgwMDE2OH0.UW1dHRt4hGF6uCdPXimxv0Ggwq5uJ1WoQuCZ1_ixmCU"
```
3. Now running the local development server will connect to your Supabase backend
```
cd nextjs
npm run
```


## Local Setup (Optional)
1. [Setup local Supabase](../supabase/local-development/pull-changes.md#setup)
2. Copy local environment file
```
cd nextjs
cp .env.local.example .env.local
```
3. Run the local development server
```bash
npm run
```
:::note
`.env.local` variables will override the `.env` variables when running nextjs locally. [Click here for more info](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#default-environment-variables)
:::
