---
sidebar_position: 4
---
# Troubleshooting

## Supabase Migrations

If you are facing supabase migration problems, for example if your local database is out of sync with the server database, use the following commands:

### List migrations

```bash
supabase migrations list
```

### Repair a specific migration

```bash
supabase migration repair <migration-number> --status reverted
```

### Reset the database

```bash
supabase db reset
```
