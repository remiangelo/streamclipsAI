import { db } from '@/lib/db';
import { getTierLimits, type SubscriptionTierId } from '@/lib/lemonsqueezy';
import { TRPCError } from '@trpc/server';

export async function checkClipLimit(userId: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  // Check if subscription is active
  if (user.subscriptionStatus !== 'ACTIVE' && user.subscriptionTier !== 'free') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Subscription is not active. Please update your subscription.',
    });
  }

  const tierLimits = getTierLimits(user.subscriptionTier as SubscriptionTierId);

  // Unlimited clips for certain tiers
  if (tierLimits.clips === -1) {
    return;
  }

  // Check monthly limit
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const clipsThisMonth = await db.clip.count({
    where: {
      userId,
      createdAt: {
        gte: currentMonth,
      },
    },
  });

  if (clipsThisMonth >= tierLimits.clips) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Monthly clip limit reached (${tierLimits.clips} clips). Please upgrade your subscription.`,
    });
  }
}

export async function checkStorageLimit(userId: string, additionalBytes: number = 0): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { 
      subscriptionTier: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'User not found',
    });
  }

  const tierLimits = getTierLimits(user.subscriptionTier as SubscriptionTierId);

  // Calculate current storage usage
  const clips = await db.clip.findMany({
    where: { userId },
    select: { duration: true },
  });

  // Estimate storage: ~10MB per second of video
  const currentUsage = clips.reduce((total, clip) => {
    return total + (clip.duration * 10 * 1024 * 1024);
  }, 0);

  const projectedUsage = currentUsage + additionalBytes;

  if (projectedUsage > tierLimits.storage) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: `Storage limit exceeded (${tierLimits.storage / (1024 * 1024 * 1024)}GB). Please upgrade your subscription or delete old clips.`,
    });
  }
}

export async function getUsageStats(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true },
  });

  if (!user) {
    return null;
  }

  const tierLimits = getTierLimits(user.subscriptionTier as SubscriptionTierId);

  // Get monthly clips
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const clipsThisMonth = await db.clip.count({
    where: {
      userId,
      createdAt: {
        gte: currentMonth,
      },
    },
  });

  // Get storage usage
  const clips = await db.clip.findMany({
    where: { userId },
    select: { duration: true },
  });

  const storageUsed = clips.reduce((total, clip) => {
    return total + (clip.duration * 10 * 1024 * 1024);
  }, 0);

  return {
    clips: {
      used: clipsThisMonth,
      limit: tierLimits.clips,
      percentage: tierLimits.clips === -1 ? 0 : (clipsThisMonth / tierLimits.clips) * 100,
    },
    storage: {
      used: storageUsed,
      limit: tierLimits.storage,
      percentage: (storageUsed / tierLimits.storage) * 100,
    },
  };
}