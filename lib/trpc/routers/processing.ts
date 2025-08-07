import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

// Subscription tier limits
const SUBSCRIPTION_LIMITS = {
  free: { concurrent: 1, monthly: 5 },
  starter: { concurrent: 2, monthly: 50 },
  studio: { concurrent: 5, monthly: -1 }, // -1 means unlimited
} as const

const MAX_SYSTEM_JOBS = 100 // System-wide limit to prevent overload
const JOB_TIMEOUT_HOURS = 1 // Jobs running longer than this are considered timed out
const MAX_RETRIES = 3

export const processingRouter = createTRPCRouter({
  startVodProcessing: protectedProcedure
    .input(
      z.object({
        vodId: z.string(),
        forceReprocess: z.boolean().optional(),
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

      // Check if VOD is already processed
      if (vod.processingStatus === 'completed' && !input.forceReprocess) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'VOD has already been processed',
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

      // Check concurrent job limits
      const activeJobsCount = await ctx.db.processingJob.count({
        where: {
          userId: user.id,
          status: { in: ['pending', 'running'] },
        },
      })

      const limits = SUBSCRIPTION_LIMITS[user.subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS] || SUBSCRIPTION_LIMITS.free
      if (activeJobsCount >= limits.concurrent) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Concurrent job limit exceeded',
        })
      }

      // Check system overload
      const totalSystemJobs = await ctx.db.processingJob.count({
        where: {
          status: { in: ['pending', 'running'] },
        },
      })

      if (totalSystemJobs >= MAX_SYSTEM_JOBS) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'System is currently overloaded. Please try again later.',
        })
      }

      // Set priority based on subscription tier
      const priority = user.subscriptionTier === 'studio' ? 'high' : 
                      user.subscriptionTier === 'starter' ? 'medium' : 'low'

      const job = await ctx.db.processingJob.create({
        data: {
          userId: user.id,
          vodId: input.vodId,
          jobType: 'chat_analysis',
          status: 'pending',
          priority,
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

      // Check for timeout
      if (job.status === 'running' && job.startedAt) {
        const hoursRunning = (Date.now() - job.startedAt.getTime()) / (1000 * 60 * 60)
        if (hoursRunning > JOB_TIMEOUT_HOURS) {
          // Update job status to failed
          await ctx.db.processingJob.update({
            where: { id: job.id },
            data: {
              status: 'failed',
              error: 'Job timeout - running for too long',
              completedAt: new Date(),
            },
          })
          return {
            ...job,
            status: 'failed',
            error: 'Job timeout - running for too long',
          }
        }
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

  cancelJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
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

      const job = await ctx.db.processingJob.findFirst({
        where: {
          id: input.jobId,
          userId: user.id,
        },
      })

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or unauthorized',
        })
      }

      if (job.status === 'completed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job is already completed',
        })
      }

      if (job.status === 'failed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Job has already failed',
        })
      }

      if (job.status === 'running') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot cancel a running job',
        })
      }

      await ctx.db.processingJob.update({
        where: { id: input.jobId },
        data: { status: 'cancelled' },
      })

      return { success: true }
    }),

  retryJob: protectedProcedure
    .input(
      z.object({
        jobId: z.string(),
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

      const job = await ctx.db.processingJob.findFirst({
        where: {
          id: input.jobId,
          userId: user.id,
        },
      })

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found or unauthorized',
        })
      }

      if (job.status !== 'failed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Can only retry failed jobs',
        })
      }

      if (job.retryCount >= MAX_RETRIES) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Maximum retry limit reached',
        })
      }

      // Create a new job with incremented retry count
      const newJob = await ctx.db.processingJob.create({
        data: {
          userId: job.userId,
          vodId: job.vodId,
          jobType: job.jobType,
          status: 'pending',
          priority: job.priority,
          retryCount: job.retryCount + 1,
        },
      })

      return { newJobId: newJob.id }
    }),
})