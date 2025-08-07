# Payment Setup with LemonSqueezy

This guide explains how to set up LemonSqueezy payment processing for StreamClips AI.

## Overview

StreamClips AI uses LemonSqueezy for subscription management, offering three paid tiers:
- **Starter**: $9/month - 50 clips, 50GB storage
- **Pro**: $29/month - Unlimited clips, 200GB storage
- **Studio**: $99/month - Unlimited clips, 1TB storage, team features

## Setup Steps

### 1. Create LemonSqueezy Account

1. Sign up at [lemonsqueezy.com](https://lemonsqueezy.com)
2. Complete account verification
3. Set up your store

### 2. Configure Environment Variables

Add to your `.env.local`:

```env
# LemonSqueezy API credentials
LEMONSQUEEZY_API_KEY=your-api-key
LEMONSQUEEZY_STORE_ID=your-store-id
LEMONSQUEEZY_WEBHOOK_SECRET=your-webhook-secret

# Product variant IDs (get these after creating products)
LEMONSQUEEZY_STARTER_VARIANT_ID=
LEMONSQUEEZY_PRO_VARIANT_ID=
LEMONSQUEEZY_STUDIO_VARIANT_ID=
```

### 3. Create Subscription Products

In your LemonSqueezy dashboard:

1. **Create Product: StreamClips AI Starter**
   - Price: $9/month
   - Recurring billing
   - Description: 50 clips/month, 50GB storage

2. **Create Product: StreamClips AI Pro**
   - Price: $29/month
   - Recurring billing
   - Description: Unlimited clips, 200GB storage

3. **Create Product: StreamClips AI Studio**
   - Price: $99/month
   - Recurring billing
   - Description: Everything in Pro + 1TB storage, team features

### 4. Get Variant IDs

Run the setup script to get your variant IDs:

```bash
npm run setup:lemonsqueezy
```

This will:
- Test your API connection
- List all products and variants
- Show variant IDs to add to your `.env.local`
- Set up the webhook endpoint

### 5. Configure Webhook

The webhook endpoint is automatically created at:
```
https://your-domain.com/api/webhooks/lemonsqueezy
```

Events handled:
- `subscription_created`
- `subscription_updated`
- `subscription_cancelled`
- `subscription_resumed`
- `subscription_expired`
- `subscription_paused`
- `subscription_unpaused`
- `subscription_payment_success`
- `subscription_payment_failed`

### 6. Update Database

Run the database migration to add subscription fields:

```bash
npm run db:push
```

## Testing

### Local Testing

1. Use LemonSqueezy test mode
2. Test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

### Test Webhook Locally

Use ngrok or similar to expose your local webhook:

```bash
ngrok http 3000
```

Update webhook URL in LemonSqueezy to your ngrok URL.

## Integration Points

### 1. Subscription Status Check

Before any clip creation:
```typescript
await checkClipLimit(userId);
await checkStorageLimit(userId, estimatedSize);
```

### 2. Customer Portal

Users can manage billing through LemonSqueezy's customer portal:
```typescript
const portalUrl = await getCustomerPortalUrl(subscriptionId);
```

### 3. Usage Tracking

Track usage in `UserAnalytics` table:
- Clips created per month
- Storage used
- Processing time

## Subscription Flow

1. **User clicks upgrade** → Redirect to LemonSqueezy checkout
2. **Payment successful** → Webhook updates user's subscription
3. **User returns** → Success page with confetti 🎉
4. **Subscription active** → Higher limits immediately available

## Troubleshooting

### Webhook Not Firing

1. Check webhook secret matches
2. Verify webhook URL is accessible
3. Check LemonSqueezy webhook logs

### Subscription Not Updating

1. Check database for user's `lemonSqueezySubscriptionId`
2. Verify webhook processing in logs
3. Check user's email matches LemonSqueezy

### Payment Failures

LemonSqueezy handles:
- Retry logic
- Dunning emails
- Grace periods

## Production Checklist

- [ ] Set up production LemonSqueezy account
- [ ] Configure production webhook URL
- [ ] Test full payment flow
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications
- [ ] Set up analytics tracking
- [ ] Test subscription upgrades/downgrades
- [ ] Test cancellation flow
- [ ] Verify usage limits enforcement