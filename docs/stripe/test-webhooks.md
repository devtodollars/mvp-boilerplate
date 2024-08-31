---
sidebar_position: 3
---
# Test Webhooks
1. Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to [login to your Stripe account](https://stripe.com/docs/stripe-cli#login-account)
```
stripe login
```
This will print a URL to navigate to in your browser and provide access to your Stripe account

2. Next, in a separate terminal, start local webhook forwarding:
```
stripe listen --forward-to=http://127.0.0.1:54321/functions/v1/stripe_webhook
```

Running this Stripe command will print a webhook secret (such as, `whsec_***`) to the console. Set `STRIPE_WEBHOOK_SECRET` to this value in your `.env` file. 

3. In another terminal, run the local supabase server. See [Local Supabase Setup](../supabase/local-development/setup.md) for more information.
```
supabase functions serve --env-file .env --import-map supabase/functions/deno.json
```

4. Now local webhooks should be working!

:::note
One way to test to see if everything is working is by running stripe fixtures. This will prepopulate test products and prices into stripe.
```
stripe fixtures nextjs/fixtures/stripe-fixtures.json
```
Now check your supabase local dashboard (http://localhost:54323/project/default/editor) and see if new rows have been populated
:::



