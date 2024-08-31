---
sidebar_position: 2
---
# Pulling Prod Changes to Local Environment

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



