import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'

export const userRouter = createTRPCRouter({
  me: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId

    const user = await ctx.db.user.findUnique({
      where: { clerkId: userId },
      include: {
        _count: {
          select: {
            vods: true,
            clips: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    return user
  }),

  stats: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId

    const user = await ctx.db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    const [totalClips, totalVods, recentClips, processingJobs] = await Promise.all([
      ctx.db.clip.count({ where: { userId: user.id } }),
      ctx.db.vOD.count({ where: { userId: user.id } }),
      ctx.db.clip.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          vod: {
            select: {
              title: true,
              thumbnailUrl: true,
            },
          },
        },
      }),
      ctx.db.processingJob.count({
        where: {
          userId: user.id,
          status: { in: ['pending', 'running'] },
        },
      }),
    ])

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const monthlyClips = await ctx.db.clip.count({
      where: {
        userId: user.id,
        createdAt: { gte: currentMonth },
      },
    })

    return {
      totalClips,
      totalVods,
      monthlyClips,
      processingJobs,
      recentClips,
      creditsRemaining: user.creditsRemaining,
      processingQuota: user.processingQuota,
      subscriptionTier: user.subscriptionTier,
      role: user.role,
    }
  }),

  getNotificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.auth.userId

    const user = await ctx.db.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      })
    }

    const preferences = await ctx.db.userPreferences.findUnique({
      where: { userId: user.id },
    })

    // Return default preferences if none exist
    if (!preferences) {
      return {
        emailNotifications: true,
        emailProcessingComplete: true,
        emailProcessingFailed: true,
        emailSubscriptionUpdates: true,
        emailProductUpdates: false,
        emailWeeklyDigest: false,
      }
    }

    return {
      emailNotifications: preferences.emailNotifications,
      emailProcessingComplete: preferences.emailProcessingComplete,
      emailProcessingFailed: preferences.emailProcessingFailed,
      emailSubscriptionUpdates: preferences.emailSubscriptionUpdates,
      emailProductUpdates: preferences.emailProductUpdates,
      emailWeeklyDigest: preferences.emailWeeklyDigest,
    }
  }),

  updateNotificationPreferences: protectedProcedure
    .input(
      z.object({
        emailNotifications: z.boolean(),
        emailProcessingComplete: z.boolean(),
        emailProcessingFailed: z.boolean(),
        emailSubscriptionUpdates: z.boolean(),
        emailProductUpdates: z.boolean(),
        emailWeeklyDigest: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.auth.userId

      const user = await ctx.db.user.findUnique({
        where: { clerkId: userId },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User not found',
        })
      }

      const preferences = await ctx.db.userPreferences.upsert({
        where: { userId: user.id },
        update: input,
        create: {
          userId: user.id,
          ...input,
        },
      })

      return preferences
    }),
})