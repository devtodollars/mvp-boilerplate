---
sidebar_position: 2
---
# Setup Supabase
## Setup backend
1. Setup [NextJS](quickstart.md) and [Supabase](../supabase/README.md)
2. To connect your project to the supabase deployed environment, navigate to Project Settings > Data API, copy the project url and put it in `NEXT_PUBLIC_SUPABASE_URL`. Then navigate to Project Settings > API Keys, create a Publishable and secret Key api. Finally copy the default key's value from the Publishable key in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
```
NEXT_PUBLIC_SUPABASE_URL="https://crnytzptlghehxsarjxm.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_5kkxiPW8Oq6dAbn4qeF4Cw_iUZBqmSf"
```
3. Now running the local development server will connect to your Supabase backend
```
cd nextjs
npm run
```
:::info 
Supabase used to have a Legacy anon key, and service_role API key which could only be created once. This key was not rollable. Having a service role key that is generated once during project creation and cannot be changed, has consequence. Specifically, if your key gets exposed, its gonna create a lot of headaches for you. Having a rollable key allows you to switch the keys if anything happens. I recommend using the publishable and secret API keys. If you have an old project using Legacy keys, please switch the keys.
:::


## Local Setup (Optional)
1. [Setup local Supabase](../supabase/local-development/setup.md)
2. Copy local environment file
```
cd nextjs
cp .env.local.example .env.local
```
3. Run the local development server
```bash
pnpm run
```
:::note
`.env.local` variables will override the `.env` variables when running nextjs locally. [Click here for more info](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables#default-environment-variables)
:::
