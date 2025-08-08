import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { getTierByVariantId } from '@/lib/lemonsqueezy';
import { emailService } from '@/lib/email';
import { config } from '@/lib/config';
import type { SubscriptionTier } from '@prisma/client';

// Verify webhook signature
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-signature');
    const secret = config.lemonsqueezy.webhookSecret;

    if (!signature || !secret) {
      return NextResponse.json(
        { error: 'Missing signature or secret' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature, secret)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const payload = JSON.parse(body);
    const { meta, data } = payload;

    // Idempotency: deduplicate webhook events (raw SQL upsert)
    const eventId = (meta?.event_id as string | undefined) ?? `${data?.id || 'unknown'}:${meta?.event_name || 'unknown'}`;
    const hash = crypto.createHash('sha256').update(`lemonsqueezy:${eventId}`).digest('hex');
    try {
      await db.$executeRaw`INSERT INTO "WebhookDedup" ("provider","hash") VALUES ('lemonsqueezy', ${hash}) ON CONFLICT ("hash") DO NOTHING`;
    } catch (e) {
      // If table doesn't exist yet (migration not applied), continue processing without dedup
      console.error('Webhook dedup insert failed (continuing):', e);
    }

    // Extract event data
    const eventName = meta.event_name;
    const customData = data.attributes.first_subscription_item?.price_data?.custom_data || 
                      data.attributes.custom_data || 
                      {};
    const userId = customData.user_id;

    if (!userId) {
      console.error('No user_id in webhook payload');
      return NextResponse.json(
        { error: 'Missing user_id' },
        { status: 400 }
      );
    }

    // Handle different events
    switch (eventName) {
      case 'subscription_created':
      case 'subscription_resumed':
      case 'subscription_unpaused': {
        const variantId = data.attributes.variant_id?.toString();
        const tier = getTierByVariantId(variantId);
        
        if (!tier) {
          console.error('Unknown variant ID:', variantId);
          break;
        }

        const tierLower = tier.toLowerCase() as SubscriptionTier;

        const updatedUser = await db.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tierLower,
            subscriptionStatus: 'ACTIVE',
            lemonSqueezySubscriptionId: data.id,
            lemonSqueezyCustomerId: data.attributes.customer_id?.toString(),
            subscriptionCurrentPeriodEnd: new Date(data.attributes.renews_at),
          },
        });

        // Send subscription confirmation email
        const preferences = await db.userPreferences.findUnique({
          where: { userId }
        });
        
        if (updatedUser.email && preferences?.emailSubscriptionUpdates !== false) {
          const tierFeatures = {
            starter: [
              '20 clips per month',
              'Standard processing speed',
              'HD export quality',
              'Basic platform exports',
            ],
            pro: [
              'Unlimited clips per month',
              'Priority processing',
              'Custom branding & watermarks',
              '4K export quality',
              'Advanced analytics',
              'All platform exports',
            ],
            studio: [
              'Everything in Pro',
              'Team collaboration (5 members)',
              'API access',
              'Custom AI training',
              'Priority support',
              'Bulk processing',
            ],
          };

          const planName = tierLower.charAt(0).toUpperCase() + tierLower.slice(1);
          const features = tierLower === 'free' ? [] : (tierFeatures[tierLower as 'starter' | 'pro' | 'studio'] || []);
          await emailService.sendSubscriptionConfirmationEmail({
            to: updatedUser.email,
            userName: updatedUser.twitchUsername || 'Streamer',
            planName,
            features,
          });
        }

        console.log(`Subscription ${eventName} for user ${userId}, tier: ${tier}`);
        break;
      }

      case 'subscription_updated': {
        const variantId = data.attributes.variant_id?.toString();
        const tier = getTierByVariantId(variantId);
        
        if (!tier) {
          console.error('Unknown variant ID:', variantId);
          break;
        }

        const tierLower = tier.toLowerCase() as SubscriptionTier;

        const status = data.attributes.status;
        const subscriptionStatus =
          status === 'active' ? 'ACTIVE' :
          status === 'cancelled' ? 'CANCELLED' :
          status === 'paused' ? 'PAUSED' :
          'INACTIVE';

        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionTier: tierLower,
            subscriptionStatus,
            subscriptionCurrentPeriodEnd: new Date(data.attributes.renews_at),
          },
        });

        console.log(`Subscription updated for user ${userId}, tier: ${tier}, status: ${subscriptionStatus}`);
        break;
      }

      case 'subscription_cancelled':
      case 'subscription_expired': {
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: eventName === 'subscription_cancelled' ? 'CANCELLED' : 'EXPIRED',
            subscriptionTier: 'free',
          },
        });

        console.log(`Subscription ${eventName} for user ${userId}`);
        break;
      }

      case 'subscription_paused': {
        await db.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: 'PAUSED',
          },
        });

        console.log(`Subscription paused for user ${userId}`);
        break;
      }

      case 'subscription_payment_success': {
        // Log payment success
        console.log(`Payment successful for user ${userId}`);
        
        // Update or create analytics record for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await db.userAnalytics.upsert({
          where: {
            userId_date: {
              userId,
              date: today
            }
          },
          update: {
            lastActiveAt: new Date()
          },
          create: {
            userId,
            date: today,
            lastActiveAt: new Date()
          }
        });
        break;
      }

      case 'subscription_payment_failed': {
        // Could send notification to user
        console.log(`Payment failed for user ${userId}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}