import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const processingRouter = createTRPCRouter({
  startVodProcessing: protectedProcedure
    .input(
      z.object({
        vodId: z.string(),
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

      const vod = await ctx.db.vOD.findFirst({
        where: { id: input.vodId, userId: user.id },
      })

      if (!vod) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'VOD not found or unauthorized',
        })
      }

      const currentMonth = new Date()
      currentMonth.setDate(1)
      currentMonth.setHours(0, 0, 0, 0)

      const monthlyClipsCount = await ctx.db.clip.count({
        where: {
          userId: user.id,
          createdAt: { gte: currentMonth },
        },
      })

      if (monthlyClipsCount >= user.processingQuota && user.subscriptionTier !== 'studio') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Monthly processing quota exceeded',
        })
      }

      const job = await ctx.db.processingJob.create({
        data: {
          userId: user.id,
          vodId: input.vodId,
          jobType: 'chat_analysis',
          status: 'pending',
        },
      })

      await ctx.db.vOD.update({
        where: { id: input.vodId },
        data: { processingStatus: 'analyzing_chat' },
      })

      return { jobId: job.id }
    }),

  getJobStatus: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
      })
    )
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

      const job = await ctx.db.processingJob.findFirst({
        where: {
          id: input.jobId,
          userId: user.id,
        },
        include: {
          vod: {
            select: {
              title: true,
              processingStatus: true,
              processingProgress: true,
            },
          },
        },
      })

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or unauthorized',
        })
      }

      return job
    }),

  listActiveJobs: protectedProcedure.query(async ({ ctx }) => {
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

    const jobs = await ctx.db.processingJob.findMany({
      where: {
        userId: user.id,
        status: { in: ['pending', 'running'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        vod: {
          select: {
            title: true,
            thumbnailUrl: true,
          },
        },
      },
    })

    return jobs
  }),
})