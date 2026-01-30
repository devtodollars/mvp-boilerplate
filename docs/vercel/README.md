# Backend (Vercel)

## Overview

This boilerplate supports two backend options:
- **Vercel API Routes / Edge Functions** - For simple, fast APIs (< 30 seconds execution)
- **Supabase Edge Functions** - For longer-running jobs (< 4 minutes execution)

## Environment Setup

### Required Environment Variables

Add the following to your Vercel project settings under **Settings > Environment Variables**:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key (secret) |

To find your `SUPABASE_SERVICE_ROLE_KEY`:
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings > API**
4. Copy the `service_role` key under **Project API keys**

> **Warning**: The service role key bypasses Row Level Security (RLS). Never expose it to the client/browser. Only use it in server-side code.

## Supabase Admin Client

This boilerplate provides two admin client variants in `nextjs/utils/supabase/admin.ts`:

### `createAdminClient()` - No Cookie Access

```typescript
import { createAdminClient } from '@/utils/supabase/admin';

const supabase = createAdminClient();
```

**Use when:**
- Running server-to-server operations (webhooks, cron jobs)
- No user context is needed
- Processing background tasks

**Example:** Stripe webhook handler that syncs subscription data.

### `createAdminClientWithCookies()` - With Cookie Access

```typescript
import { createAdminClientWithCookies } from '@/utils/supabase/admin';

const supabase = await createAdminClientWithCookies();
const { data: { user } } = await supabase.auth.getUser();
```

**Use when:**
- You need to identify the logged-in user
- You need admin-level database access for that user's request
- Running in API routes or Server Components with user context

**Example:** Fetching user profile data that requires bypassing RLS or row limits.

## Service Role Key Benefits

The service role key provides elevated privileges:

| Capability | Anon Key | Service Role Key |
|------------|----------|------------------|
| Subject to RLS policies | Yes | **No (bypassed)** |
| Row fetch limit (1000 default) | Yes | **No limit** |
| Can access all tables | Only per RLS | **Yes** |
| Safe for client-side | Yes | **No** |

### When to Use Service Role

- Fetching data across multiple users (admin dashboards)
- Bulk operations that exceed row limits
- Background jobs that process all records
- Webhook handlers that need full database access

## Vercel vs Supabase Backend

Choose the right backend for your use case:

| Aspect | Vercel (API Routes/Edge) | Supabase (Edge Functions) |
|--------|--------------------------|---------------------------|
| **Max execution time** | 30 seconds (Hobby) / 5 min (Pro) | 400 seconds (~6.5 min) |
| **Best for** | Simple, fast APIs | Longer-running jobs |
| **Cold start** | Minimal (Edge) | ~200-500ms |
| **Language** | TypeScript/JavaScript | TypeScript (Deno) |
| **Deployment** | Automatic with Next.js | Separate `supabase functions deploy` |

### Use Vercel Backend When:
- API response time should be < 30 seconds
- You need tight integration with Next.js (middleware, Server Components)
- Simple CRUD operations
- Real-time data fetching for UI

### Use Supabase Backend When:
- Operations may take 30 seconds to 4 minutes
- Processing webhooks with retry logic
- Batch processing or data migrations
- Tasks that benefit from being close to the database

## Project Structure

```
nextjs/
├── app/
│   └── api/           # Vercel API routes
│       └── og/        # Example: OG image generation
├── utils/
│   └── supabase/
│       ├── admin.ts   # Admin clients (service role)
│       ├── server.ts  # Server client (anon key + cookies)
│       └── client.ts  # Browser client (anon key)
```

## Helpful Links

- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Vercel Edge Functions](https://vercel.com/docs/functions/edge-functions)
- [Supabase Service Role Key](https://supabase.com/docs/guides/api/api-keys#service-role-key)
