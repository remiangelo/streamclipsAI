import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { 
  createCheckoutUrl, 
  getUserSubscription, 
  cancelUserSubscription,
  resumeUserSubscription,
  getCustomerPortalUrl,
  SUBSCRIPTION_TIERS,
  type SubscriptionTierId,
  getTierLimits
} from '@/lib/lemonsqueezy';
import { db } from '@/lib/db';

export const subscriptionRouter = router({
  // Get current subscription status
  getStatus: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionCurrentPeriodEnd: true,
        lemonSqueezySubscriptionId: true,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get usage stats
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const [clipsThisMonth, storageUsed] = await Promise.all([
      db.clip.count({
        where: {
          userId: ctx.userId,
          createdAt: {
            gte: currentMonth,
          },
        },
      }),
      db.clip.aggregate({
        where: { userId: ctx.userId },
        _sum: {
          duration: true,
        },
      }),
    ]);

    const tierLimits = getTierLimits(user.subscriptionTier as SubscriptionTierId);
    const estimatedStorage = (storageUsed._sum.duration || 0) * 10 * 1024 * 1024; // Rough estimate: 10MB per second

    return {
      tier: user.subscriptionTier,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      usage: {
        clipsUsed: clipsThisMonth,
        clipsLimit: tierLimits.clips,
        storageUsed: estimatedStorage,
        storageLimit: tierLimits.storage,
      },
      canUpgrade: user.subscriptionTier !== 'STUDIO',
      canDowngrade: user.subscriptionTier !== 'FREE' && user.subscriptionStatus === 'ACTIVE',
    };
  }),

  // Get available plans
  getPlans: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { subscriptionTier: true },
    });

    return Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => ({
      id: key,
      ...tier,
      current: user?.subscriptionTier === key.toLowerCase(),
    }));
  }),

  // Create checkout session
  createCheckout: protectedProcedure
    .input(
      z.object({
        tier: z.enum(['STARTER', 'PRO', 'STUDIO']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { email: true, subscriptionTier: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const tier = SUBSCRIPTION_TIERS[input.tier];
      if (!tier.variantId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid tier',
        });
      }

      const checkoutUrl = await createCheckoutUrl(
        tier.variantId,
        user.email,
        ctx.userId,
        {
          current_tier: user.subscriptionTier,
          upgrade_from: user.subscriptionTier,
        }
      );

      if (!checkoutUrl) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create checkout session',
        });
      }

      return { url: checkoutUrl };
    }),

  // Cancel subscription
  cancel: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { lemonSqueezySubscriptionId: true },
    });

    if (!user?.lemonSqueezySubscriptionId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No active subscription found',
      });
    }

    const success = await cancelUserSubscription(user.lemonSqueezySubscriptionId);

    if (!success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cancel subscription',
      });
    }

    await db.user.update({
      where: { id: ctx.userId },
      data: { subscriptionStatus: 'CANCELLED' },
    });

    return { success: true };
  }),

  // Resume cancelled subscription
  resume: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { 
        lemonSqueezySubscriptionId: true,
        subscriptionStatus: true,
      },
    });

    if (!user?.lemonSqueezySubscriptionId) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'No subscription found',
      });
    }

    if (user.subscriptionStatus !== 'CANCELLED') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Subscription is not cancelled',
      });
    }

    const success = await resumeUserSubscription(user.lemonSqueezySubscriptionId);

    if (!success) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resume subscription',
      });
    }

    await db.user.update({
      where: { id: ctx.userId },
      data: { subscriptionStatus: 'ACTIVE' },
    });

    return { success: true };
  }),

  // Get customer portal URL
  getPortalUrl: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.user.findUnique({
      where: { id: ctx.userId },
      select: { lemonSqueezySubscriptionId: true },
    });

    if (!user?.lemonSqueezySubscriptionId) {
      return { url: null };
    }

    const url = await getCustomerPortalUrl(user.lemonSqueezySubscriptionId);
    return { url };
  }),

  // Check if user can perform action based on limits
  checkLimits: protectedProcedure
    .input(
      z.object({
        action: z.enum(['create_clip', 'upload_storage']),
        amount: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await db.user.findUnique({
        where: { id: ctx.userId },
        select: { subscriptionTier: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
      }

      const tierLimits = getTierLimits(user.subscriptionTier as SubscriptionTierId);

      if (input.action === 'create_clip') {
        if (tierLimits.clips === -1) {
          return { allowed: true, reason: null };
        }

        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const clipsThisMonth = await db.clip.count({
          where: {
            userId: ctx.userId,
            createdAt: {
              gte: currentMonth,
            },
          },
        });

        const allowed = clipsThisMonth < tierLimits.clips;
        return {
          allowed,
          reason: allowed ? null : `Monthly clip limit reached (${tierLimits.clips} clips)`,
          usage: {
            used: clipsThisMonth,
            limit: tierLimits.clips,
          },
        };
      }

      if (input.action === 'upload_storage') {
        const storageUsed = await db.clip.aggregate({
          where: { userId: ctx.userId },
          _sum: {
            duration: true,
          },
        });

        const estimatedStorage = (storageUsed._sum.duration || 0) * 10 * 1024 * 1024; // 10MB per second estimate
        const newTotal = estimatedStorage + (input.amount || 0);
        const allowed = newTotal <= tierLimits.storage;

        return {
          allowed,
          reason: allowed ? null : `Storage limit exceeded (${tierLimits.storage / (1024 * 1024 * 1024)}GB)`,
          usage: {
            used: estimatedStorage,
            limit: tierLimits.storage,
          },
        };
      }

      return { allowed: true, reason: null };
    }),
});