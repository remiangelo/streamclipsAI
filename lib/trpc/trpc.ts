import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/db'
import superjson from 'superjson'
import { ZodError } from 'zod'

export const createTRPCContext = async (opts: FetchCreateContextFnOptions | CreateNextContextOptions) => {
  const sesh = await auth()

  return {
    db,
    auth: sesh,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    }
  },
})

export const createCallerFactory = t.createCallerFactory

export const createTRPCRouter = t.router

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  return next({
    ctx: {
      auth: { ...ctx.auth, userId: ctx.auth.userId },
    },
  })
})

export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)