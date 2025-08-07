import { lemonSqueezySetup, listProducts, listVariants, createCheckout, listSubscriptions, getSubscription, updateSubscription, cancelSubscription, listWebhooks, createWebhook, type Variant, type Product, type Subscription } from '@lemonsqueezy/lemonsqueezy.js';

// Initialize LemonSqueezy
export function initLemonSqueezy() {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!apiKey) {
    throw new Error('LEMONSQUEEZY_API_KEY is not set');
  }
  
  lemonSqueezySetup({
    apiKey,
    onError: (error) => {
      console.error('LemonSqueezy Error:', error);
    },
  });
}

// Subscription tiers configuration
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    clips: 5,
    storage: 5, // GB
    features: [
      '5 clips per month',
      '5GB storage',
      'Basic export options',
      'Community support'
    ]
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    variantId: process.env.LEMONSQUEEZY_STARTER_VARIANT_ID,
    price: 9,
    clips: 50,
    storage: 50, // GB
    features: [
      '50 clips per month',
      '50GB storage',
      'HD exports',
      'Platform-specific formats',
      'Email support',
      'Basic analytics'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID,
    price: 29,
    clips: -1, // Unlimited
    storage: 200, // GB
    features: [
      'Unlimited clips',
      '200GB storage',
      '4K exports',
      'All platform formats',
      'Priority support',
      'Advanced analytics',
      'Custom branding',
      'API access'
    ]
  },
  STUDIO: {
    id: 'studio',
    name: 'Studio',
    variantId: process.env.LEMONSQUEEZY_STUDIO_VARIANT_ID,
    price: 99,
    clips: -1, // Unlimited
    storage: 1024, // 1TB
    features: [
      'Everything in Pro',
      '1TB storage',
      'Team collaboration',
      'White-label options',
      'Dedicated support',
      'Custom integrations',
      'SLA guarantee'
    ]
  }
};

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;

// Get products and variants
export async function getProducts() {
  try {
    initLemonSqueezy();
    const { data: products } = await listProducts();
    return products;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

export async function getVariants(productId?: string) {
  try {
    initLemonSqueezy();
    const { data: variants } = await listVariants({
      filter: productId ? { productId } : undefined,
    });
    return variants;
  } catch (error) {
    console.error('Failed to fetch variants:', error);
    return [];
  }
}

// Create checkout session
export async function createCheckoutUrl(
  variantId: string,
  email: string,
  userId: string,
  customData?: Record<string, any>
): Promise<string | null> {
  try {
    initLemonSqueezy();
    
    const { data } = await createCheckout(
      process.env.LEMONSQUEEZY_STORE_ID!,
      variantId,
      {
        checkoutData: {
          email,
          custom: {
            user_id: userId,
            ...customData,
          },
        },
        checkoutOptions: {
          embed: false,
          media: false,
          logo: true,
        },
        productOptions: {
          enabledVariants: [variantId],
          redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/subscription/success`,
          receiptButtonText: 'Go to Dashboard',
          receiptThankYouNote: 'Thank you for subscribing to StreamClips AI!',
        },
      }
    );

    return data?.data.attributes.url || null;
  } catch (error) {
    console.error('Failed to create checkout:', error);
    return null;
  }
}

// Get user's subscription
export async function getUserSubscription(email: string): Promise<Subscription | null> {
  try {
    initLemonSqueezy();
    
    const { data } = await listSubscriptions({
      filter: {
        email,
        status: 'active',
      },
    });

    if (data && data.data.length > 0) {
      // Return the most recent active subscription
      return data.data[0];
    }

    return null;
  } catch (error) {
    console.error('Failed to fetch subscription:', error);
    return null;
  }
}

// Update subscription (upgrade/downgrade)
export async function updateUserSubscription(
  subscriptionId: string,
  variantId: string
): Promise<boolean> {
  try {
    initLemonSqueezy();
    
    await updateSubscription(subscriptionId, {
      variantId: parseInt(variantId),
    });

    return true;
  } catch (error) {
    console.error('Failed to update subscription:', error);
    return false;
  }
}

// Cancel subscription
export async function cancelUserSubscription(subscriptionId: string): Promise<boolean> {
  try {
    initLemonSqueezy();
    
    await cancelSubscription(subscriptionId);
    return true;
  } catch (error) {
    console.error('Failed to cancel subscription:', error);
    return false;
  }
}

// Resume cancelled subscription
export async function resumeUserSubscription(subscriptionId: string): Promise<boolean> {
  try {
    initLemonSqueezy();
    
    await updateSubscription(subscriptionId, {
      cancelled: false,
    });
    
    return true;
  } catch (error) {
    console.error('Failed to resume subscription:', error);
    return false;
  }
}

// Get subscription details
export async function getSubscriptionDetails(subscriptionId: string): Promise<Subscription | null> {
  try {
    initLemonSqueezy();
    
    const { data } = await getSubscription(subscriptionId);
    return data?.data || null;
  } catch (error) {
    console.error('Failed to get subscription details:', error);
    return null;
  }
}

// Customer portal URL
export async function getCustomerPortalUrl(subscriptionId: string): Promise<string | null> {
  try {
    const subscription = await getSubscriptionDetails(subscriptionId);
    return subscription?.attributes.urls.customer_portal || null;
  } catch (error) {
    console.error('Failed to get customer portal URL:', error);
    return null;
  }
}

// Webhook management
export async function setupWebhook(): Promise<boolean> {
  try {
    initLemonSqueezy();
    
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/lemonsqueezy`;
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

    if (!secret) {
      console.error('LEMONSQUEEZY_WEBHOOK_SECRET is not set');
      return false;
    }

    // Check if webhook already exists
    const { data: existingWebhooks } = await listWebhooks();
    const existingWebhook = existingWebhooks?.data.find(
      (webhook) => webhook.attributes.url === webhookUrl
    );

    if (existingWebhook) {
      console.log('Webhook already exists');
      return true;
    }

    // Create new webhook
    const { data } = await createWebhook({
      url: webhookUrl,
      events: [
        'subscription_created',
        'subscription_updated',
        'subscription_cancelled',
        'subscription_resumed',
        'subscription_expired',
        'subscription_paused',
        'subscription_unpaused',
        'subscription_payment_success',
        'subscription_payment_failed',
      ],
      secret,
    });

    return !!data;
  } catch (error) {
    console.error('Failed to setup webhook:', error);
    return false;
  }
}

// Helper to get tier by variant ID
export function getTierByVariantId(variantId: string): SubscriptionTierId | null {
  for (const [key, tier] of Object.entries(SUBSCRIPTION_TIERS)) {
    if ('variantId' in tier && tier.variantId === variantId) {
      return key as SubscriptionTierId;
    }
  }
  return null;
}

// Helper to get tier limits
export function getTierLimits(tier: SubscriptionTierId) {
  const tierConfig = SUBSCRIPTION_TIERS[tier];
  return {
    clips: tierConfig.clips,
    storage: tierConfig.storage * 1024 * 1024 * 1024, // Convert GB to bytes
    features: tierConfig.features,
  };
}