import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

export const clipRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        vodId: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(20),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { vodId, limit, cursor } = input
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

      const where = {
        userId: user.id,
        ...(vodId && { vodId }),
      }

      const clips = await ctx.db.clip.findMany({
        where,
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          vod: {
            select: {
              title: true,
              gameCategory: true,
              thumbnailUrl: true,
            },
          },
        },
      })

      let nextCursor: typeof cursor | undefined = undefined
      if (clips.length > limit) {
        const nextItem = clips.pop()
        nextCursor = nextItem!.id
      }

      return {
        clips,
        nextCursor,
      }
    }),

  create: protectedProcedure
    .input(
      z.object({
        vodId: z.string(),
        title: z.string().trim().min(1).max(200),
        startTime: z.number(),
        endTime: z.number(),
        confidenceScore: z.number().min(0).max(1),
        highlightReason: z.string().optional(),
        keywords: z.array(z.string()).optional(),
      }).refine((data) => data.endTime > data.startTime, {
        message: "End time must be greater than start time",
        path: ["endTime"],
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

      // Check for overlapping clips
      const existingClips = await ctx.db.clip.findMany({
        where: {
          vodId: input.vodId,
          userId: user.id,
          OR: [
            {
              AND: [
                { startTime: { lte: input.startTime } },
                { endTime: { gt: input.startTime } },
              ],
            },
            {
              AND: [
                { startTime: { lt: input.endTime } },
                { endTime: { gte: input.endTime } },
              ],
            },
            {
              AND: [
                { startTime: { gte: input.startTime } },
                { endTime: { lte: input.endTime } },
              ],
            },
          ],
        },
      })

      if (existingClips.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Overlapping clip detected',
        })
      }

      const clip = await ctx.db.clip.create({
        data: {
          ...input,
          userId: user.id,
          keywords: input.keywords || [],
          duration: input.endTime - input.startTime,
        },
      })

      return clip
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
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

      const clip = await ctx.db.clip.findFirst({
        where: { id: input.id, userId: user.id },
      })

      if (!clip) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Clip not found or unauthorized',
        })
      }

      await ctx.db.clip.delete({
        where: { id: input.id },
      })

      return { success: true }
    }),
})