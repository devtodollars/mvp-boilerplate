# Stripe Integration Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```bash
# Stripe Test Keys (from your Stripe sandbox)
STRIPE_PUBLISHABLE_KEY=pk_test_your_sandbox_key_here
STRIPE_SECRET_KEY=sk_test_your_sandbox_key_here

# Optional: Webhook secret (for production)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

## What's Been Implemented

✅ **Payment Status Card** - Shows payment status and handles Stripe redirects
✅ **Payment Creation API** - Creates payment records before Stripe checkout
✅ **Stripe Checkout API** - Creates Stripe checkout sessions
✅ **Webhook Handler** - Processes successful payments and activates listings
✅ **Dashboard Integration** - Payment buttons in "My Property Listings" tab
✅ **Search Filtering** - Only shows active (paid) listings

## How It Works

1. **User clicks "Pay €5.00"** in the PaymentStatusCard
2. **Payment record is created** in your database
3. **Stripe checkout session is created** with the payment details
4. **User is redirected to Stripe** to complete payment
5. **After payment, webhook updates** the listing to active
6. **Listing appears in search results** for 30 days

## Testing

1. **Start your dev server**: `npm run dev`
2. **Go to test page**: `/test-stripe` to test the payment flow
3. **Test in dashboard**: Go to dashboard → Listings tab → click "Pay €5.00"

## Test Cards (Stripe Sandbox)

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Any future expiry date and CVC will work**

## Next Steps

1. **Set your environment variables** with your Stripe sandbox keys
2. **Test the payment flow** using the test page
3. **Create a real listing** and test the full flow
4. **Verify listings only show when active** in search results

## Notes

- **Sandbox mode**: No real charges will be made
- **30-day activation**: Listings are active for 30 days after payment
- **Automatic deactivation**: Expired listings are hidden from search
- **Secure**: All payments go through Stripe's secure checkout
