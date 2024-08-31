---
sidebar_position: 2
---
# Setup Supabase
## Setup backend

1. Setup [Flutter](README.md) and [Supabase](../supabase/README.md)
2. Go to Project Settings > API. Then copy the project url and anon key into the variables `SUPABASE_URL` and `SUPABASE_ANON_KEY` respectively in the `env.json` file.

```
{
  "SUPABASE_URL": "https://crnytzptlghehxsarjxm.supabase.co",
  "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybnl0enB0bGdoZWh4c2FyanhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDkyMjQxNjgsImV4cCI6MjAyNDgwMDE2OH0.UW1dHRt4hGF6uCdPXimxv0Ggwq5uJ1WoQuCZ1_ixmCU"
}
```

3. Test your flutter app that is now connected to your own backend

```bash
flutter run --dart-define-from-file=env.json
```

## Local setup (Optional)
1. [Setup local Supabase](../supabase/local-development/pull-changes.md#setup)
2. Run the flutter web app (in new terminal)

```bash
cd flutter
flutter run --dart-define-from-file=env.local.json -d chrome
```
