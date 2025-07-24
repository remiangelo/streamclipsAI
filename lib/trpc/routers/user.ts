import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

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
})