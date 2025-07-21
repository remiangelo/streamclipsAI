import { createTRPCRouter } from './trpc'
import { vodRouter } from './routers/vod'
import { clipRouter } from './routers/clip'
import { userRouter } from './routers/user'
import { processingRouter } from './routers/processing'

export const appRouter = createTRPCRouter({
  vod: vodRouter,
  clip: clipRouter,
  user: userRouter,
  processing: processingRouter,
})

export type AppRouter = typeof appRouter