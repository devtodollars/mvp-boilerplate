---
sidebar_position: 1
---
# Setup

We use [xmrcheckout](https://xmrcheckout.com/) as a Non-custodial Monero checkout software. Note that you are able to self host xmrcheckout, and the code is completely open source. For more information about self hosting please read the guide here: [https://github.com/xmrcheckout/xmrcheckout](https://github.com/xmrcheckout/xmrcheckout).

The following steps are how you setup your local development with xmrcheckout:

1. Open your Monero wallet, copy your primary address (should start with `4`) and your private view key. Use these keys to login to xmrcheckout.
2. Navigate to `https://<xmrcheckout-url>/dashboard?tab=profile` to get the values from API Key and Webhook secret and fill in the following environmental variables in the root:
```
XMRCHECKOUT_API_KEY=<XMRCHECKOUT_API_KEY>
XMRCHECKOUT_WEBHOOK_SECRET=<XMRCHECKOUT_WEBHOOK_SECRET>
XMRCHECKOUT_API_URL=<XMRCHECKOUT_API_URL>
```
3. Similar to the [Stripe webhook test guide](../stripe/test-stripeconnect-webhook.md), run ngrok to expose your local Supabase:
```bash
ngrok http 54321
```
4. Copy `https://<ngrok>/functions/v1/xmr_webhook` and paste it inside `https://<xmr-checkout-url>/dashboard?tab=webhooks`
