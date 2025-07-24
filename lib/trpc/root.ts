import { createTRPCRouter } from './trpc'
import { vodRouter } from './routers/vod'
import { clipRouter } from './routers/clip'
import { userRouter } from './routers/user'
import { processingRouter } from './routers/processing'
import { subscriptionRouter } from './routers/subscription'
import { adminRouter } from './routers/admin'

export const appRouter = createTRPCRouter({
  vod: vodRouter,
  clip: clipRouter,
  user: userRouter,
  processing: processingRouter,
  subscription: subscriptionRouter,
  admin: adminRouter,
})

export type AppRouter = typeof appRouter