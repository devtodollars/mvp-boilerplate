# Didit Integration Environment Variables

**REQUIRED** - Copy these variables to your `.env.local` file and fill in your actual values:

```bash
# Didit API Configuration (REQUIRED)
DIDIT_API_KEY=your_actual_didit_api_key_here
DIDIT_WORKFLOW_ID=your_actual_didit_workflow_id_here
DIDIT_BASE_URL=https://verification.didit.me

# Application Configuration (REQUIRED)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Getting Your Didit API Key

1. Log into your Didit account
2. Navigate to the API/Developer section
3. Generate a new API key
4. Copy the key to your `.env.local` file

## Security Notes

- Never commit your `.env.local` file to version control
- Keep your API keys secure and rotate them regularly
- Use different API keys for development and production
