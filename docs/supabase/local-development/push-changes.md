---
sidebar_position: 3
---
# Pushing Local Changes to Prod Environment

1. Make database changes to the [local supabase dashboard](http://localhost:54323/) or wherever
2. Create a new migration by running

```bash
supabase db diff -f insert_good_migration_name_here
```

3. Review the generated migration file and ensure all the changes expected changes
4. Reset your local database to ensure the migration works as expected

```bash
supabase db reset
```

5. Once you've tested everything now you can push your migrations

```bash
supabase db push
```

:::warning
`supabase db push` will update the production environment. REALLY make sure it doesn't break anything before you run this command.
:::

6. Generate updated TypeScript types from the database schema

For production database:
```bash
npx supabase gen types typescript --project-id "$PROJECT_REF" --schema public > ./nextjs/types_db.ts
```

For local database:
```bash
npx supabase gen types typescript --local --schema public > ./nextjs/types_db.ts
```
