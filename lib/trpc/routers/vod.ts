import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'
import { jobQueue } from '@/lib/job-queue'

export const vodRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input
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

      const vods = await ctx.db.vOD.findMany({
        where: { userId: user.id },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { clips: true },
          },
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (vods.length > limit) {
        const nextItem = vods.pop()
        nextCursor = nextItem!.id
      }

      return {
        vods,
        nextCursor,
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        twitchVodId: z.string(),
        title: z.string(),
        duration: z.number(),
        viewCount: z.number().optional(),
        gameCategory: z.string().optional(),
        createdDate: z.date(),
        thumbnailUrl: z.string().optional(),
        vodUrl: z.string().optional(),
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

      const vod = await ctx.db.vOD.create({
        data: {
          ...input,
          userId: user.id,
        },
      })

      return vod
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
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

      const vod = await ctx.db.vOD.findFirst({
        where: { 
          id: input.id,
          userId: user.id,
        },
        include: {
          clips: {
            orderBy: { confidenceScore: 'desc' },
          },
        },
      })

      if (!vod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'VOD not found',
        })
      }

      return vod
    }),

  analyze: protectedProcedure
    .input(z.object({ vodId: z.string() }))
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

      // Verify VOD ownership
      const vod = await ctx.db.vOD.findFirst({
        where: {
          id: input.vodId,
          userId: user.id,
        },
      })

      if (!vod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'VOD not found',
        })
      }

      // Check user's subscription limits
      const userAnalytics = await ctx.db.userAnalytics.findUnique({
        where: { userId: user.id },
      })

      if (userAnalytics && user.subscriptionTier === 'FREE') {
        const monthStart = new Date()
        monthStart.setDate(1)
        monthStart.setHours(0, 0, 0, 0)
        
        const monthlyClips = await ctx.db.clip.count({
          where: {
            userId: user.id,
            createdAt: { gte: monthStart },
          },
        })

        if (monthlyClips >= 5) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Monthly clip limit reached. Upgrade to create more clips.',
          })
        }
      }

      // Update VOD status
      await ctx.db.vOD.update({
        where: { id: vod.id },
        data: { status: 'PROCESSING' },
      })

      // Create analysis job
      const job = await jobQueue.createJob(
        'analyze_vod',
        vod.id,
        user.id,
        {
          vodUrl: vod.vodUrl,
          twitchVodId: vod.twitchVodId,
        }
      )

      return {
        success: true,
        jobId: job.id,
        message: 'VOD analysis started',
      }
    }),

  reprocess: protectedProcedure
    .input(z.object({ vodId: z.string() }))
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

      const vod = await ctx.db.vOD.findFirst({
        where: {
          id: input.vodId,
          userId: user.id,
        },
      })

      if (!vod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'VOD not found',
        })
      }

      // Delete existing clips
      await ctx.db.clip.deleteMany({
        where: { vodId: vod.id },
      })

      // Reset VOD status
      await ctx.db.vOD.update({
        where: { id: vod.id },
        data: {
          status: 'PROCESSING',
          analyzedAt: null,
        },
      })

      // Create new analysis job
      const job = await jobQueue.createJob(
        'analyze_vod',
        vod.id,
        user.id,
        {
          vodUrl: vod.vodUrl,
          twitchVodId: vod.twitchVodId,
          isReprocess: true,
        }
      )

      return {
        success: true,
        jobId: job.id,
        message: 'VOD reprocessing started',
      }
    }),
})