import { z } from 'zod'
import { createTRPCRouter, protectedProcedure } from '../trpc'
import { TRPCError } from '@trpc/server'

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
})