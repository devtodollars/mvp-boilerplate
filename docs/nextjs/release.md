---
sidebar_position: 3
---
# Release (Vercel)
1. Click the Deploy to Vercel button below

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdevtodollars%2Fstartup-boilerplate\&env=NEXT\_PUBLIC\_SUPABASE\_URL,NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY\&envDescription=Enter%20your%20supabase%20url%20and%20anon%20key\&envLink=https%3A%2F%2Fsupabase.com%2Fdashboard%2Fproject%2F\_%2Fsettings%2Fapi\&root-directory=nextjs)

2. In your Vercel deployment settings, add the following environment variables
   1. `NEXT_PUBLIC_SITE_URL`: Set it to the deployed URL
   2. `NEXT_PUBLIC_POSTHOG_HOST`: Set it to the [posthog](../posthog/README.md) host
   3. `NEXT_PUBLIC_POSTHOG_KEY`: Set it the the [posthog](../posthog/README.md) key
