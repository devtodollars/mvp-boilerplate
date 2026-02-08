---
sidebar_position: 1
---
# Installation

This boilerplate has the infrastructure to support building apps that accept Monero as a payment method for subscriptions. We understand that this is not suited for everyone, so we have isolated the code. In order to start using the Monero code, take the following steps:

1. Install the Monero related code by running the following bash script:
```bash
./monero/install.sh
```
2. Run the database reset so your migrations take effect:
```bash
supabase db reset
```
3. Sync your products with Monero support by running the following at the root folder:
```bash
deno run --env -A supabase/functions/_scripts/sync-stripe.ts --monero
```

Once the above steps are completed, proceed with the [Configuration](./configuration.md) guide to set up xmrcheckout.
