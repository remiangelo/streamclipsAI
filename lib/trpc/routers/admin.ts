import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../trpc';
import { db } from '@/lib/db';
import { ProcessingJobStatus, SubscriptionTier } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export const adminRouter = router({
  // Dashboard Overview Stats
  getOverview: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sevenDaysAgo = subDays(now, 7);

    // User stats
    const [totalUsers, newUsersThisMonth, activeUsers] = await Promise.all([
      db.user.count(),
      db.user.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      db.user.count({
        where: {
          analytics: {
            some: {
              lastActiveAt: { gte: sevenDaysAgo }
            }
          }
        }
      })
    ]);

    // Subscription stats
    const subscriptionStats = await db.user.groupBy({
      by: ['subscriptionTier'],
      _count: true,
    });

    // Processing stats
    const [totalJobs, pendingJobs, failedJobs] = await Promise.all([
      db.processingJob.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      }),
      db.processingJob.count({
        where: { status: ProcessingJobStatus.PENDING }
      }),
      db.processingJob.count({
        where: { 
          status: ProcessingJobStatus.FAILED,
          createdAt: { gte: sevenDaysAgo }
        }
      })
    ]);

    // Clip stats
    const [totalClips, clipsThisMonth] = await Promise.all([
      db.clip.count(),
      db.clip.count({
        where: { createdAt: { gte: thirtyDaysAgo } }
      })
    ]);

    // Revenue estimation (based on active subscriptions)
    const revenue = subscriptionStats.reduce((total, stat) => {
      const prices: Record<string, number> = {
        starter: 9,
        pro: 29,
        studio: 99,
      };
      return total + (prices[stat.subscriptionTier] || 0) * stat._count;
    }, 0);

    return {
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        activeThisWeek: activeUsers,
      },
      subscriptions: subscriptionStats,
      processing: {
        totalJobs,
        pendingJobs,
        failedJobs,
      },
      clips: {
        total: totalClips,
        thisMonth: clipsThisMonth,
      },
      revenue: {
        mrr: revenue,
        growth: 15.2, // TODO: Calculate actual growth
      }
    };
  }),

  // User Management
  getUsers: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      search: z.string().optional(),
      tier: z.enum(['free', 'starter', 'pro', 'studio']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where = {
        ...(input.search && {
          OR: [
            { email: { contains: input.search, mode: 'insensitive' as const } },
            { twitchUsername: { contains: input.search, mode: 'insensitive' as const } },
          ],
        }),
        ...(input.tier && { subscriptionTier: input.tier }),
      };

      const [users, total] = await Promise.all([
        db.user.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: { clips: true, vods: true }
            }
          }
        }),
        db.user.count({ where })
      ]);

      return {
        users,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Update user
  updateUser: adminProcedure
    .input(z.object({
      userId: z.string(),
      data: z.object({
        role: z.enum(['user', 'admin']).optional(),
        subscriptionTier: z.enum(['free', 'starter', 'pro', 'studio']).optional(),
        processingQuota: z.number().optional(),
      })
    }))
    .mutation(async ({ ctx, input }) => {
      const updated = await db.user.update({
        where: { id: input.userId },
        data: input.data,
      });

      return updated;
    }),

  // Processing Jobs
  getJobs: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(20),
      status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const skip = (input.page - 1) * input.limit;

      const where = {
        ...(input.status && { status: input.status }),
      };

      const [jobs, total] = await Promise.all([
        db.processingJob.findMany({
          where,
          skip,
          take: input.limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { email: true, twitchUsername: true }
            },
            vod: {
              select: { title: true }
            }
          }
        }),
        db.processingJob.count({ where })
      ]);

      return {
        jobs,
        total,
        pages: Math.ceil(total / input.limit),
      };
    }),

  // Retry failed job
  retryJob: adminProcedure
    .input(z.object({ jobId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const job = await db.processingJob.findUnique({
        where: { id: input.jobId }
      });

      if (!job) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Job not found',
        });
      }

      // Reset job to pending
      await db.processingJob.update({
        where: { id: input.jobId },
        data: {
          status: ProcessingJobStatus.PENDING,
          attempts: 0,
          error: null,
        }
      });

      return { success: true };
    }),

  // System Health
  getSystemHealth: adminProcedure.query(async ({ ctx }) => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // Check database
    let dbHealth = 'healthy';
    try {
      await db.$queryRaw`SELECT 1`;
    } catch {
      dbHealth = 'unhealthy';
    }

    // Check job queue
    const recentJobs = await db.processingJob.count({
      where: {
        updatedAt: { gte: fiveMinutesAgo }
      }
    });
    const queueHealth = recentJobs > 0 ? 'healthy' : 'idle';

    // Check storage usage
    const totalStorageUsed = await db.clip.aggregate({
      _sum: { duration: true }
    });
    const estimatedStorageGB = ((totalStorageUsed._sum.duration || 0) * 10) / 1024; // MB to GB

    // Error rate
    const [totalJobsToday, failedJobsToday] = await Promise.all([
      db.processingJob.count({
        where: { createdAt: { gte: startOfDay(now) } }
      }),
      db.processingJob.count({
        where: { 
          createdAt: { gte: startOfDay(now) },
          status: ProcessingJobStatus.FAILED
        }
      })
    ]);
    const errorRate = totalJobsToday > 0 ? (failedJobsToday / totalJobsToday) * 100 : 0;

    return {
      database: dbHealth,
      jobQueue: queueHealth,
      storage: {
        usedGB: estimatedStorageGB,
        status: estimatedStorageGB > 900 ? 'warning' : 'healthy'
      },
      errorRate: {
        percentage: errorRate,
        status: errorRate > 10 ? 'warning' : errorRate > 25 ? 'critical' : 'healthy'
      }
    };
  }),

  // Analytics
  getAnalytics: adminProcedure
    .input(z.object({
      days: z.number().default(30),
    }))
    .query(async ({ ctx, input }) => {
      const startDate = subDays(new Date(), input.days);

      // Daily stats
      const dailyStats = await db.$queryRaw<Array<{
        date: Date;
        clips: bigint;
        users: bigint;
      }>>`
        SELECT 
          DATE(created_at) as date,
          COUNT(DISTINCT CASE WHEN type = 'clip' THEN id END) as clips,
          COUNT(DISTINCT CASE WHEN type = 'user' THEN id END) as users
        FROM (
          SELECT id, created_at, 'clip' as type FROM "Clip" WHERE created_at >= ${startDate}
          UNION ALL
          SELECT id, created_at, 'user' as type FROM "User" WHERE created_at >= ${startDate}
        ) combined
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      // Top users by clips
      const topUsers = await db.user.findMany({
        take: 10,
        orderBy: {
          clips: {
            _count: 'desc'
          }
        },
        include: {
          _count: {
            select: { clips: true }
          }
        }
      });

      // Processing time stats
      const processingStats = await db.processingJob.aggregate({
        where: {
          status: ProcessingJobStatus.COMPLETED,
          processingTimeMs: { not: null },
          createdAt: { gte: startDate }
        },
        _avg: { processingTimeMs: true },
        _min: { processingTimeMs: true },
        _max: { processingTimeMs: true }
      });

      return {
        dailyStats: dailyStats.map(stat => ({
          date: stat.date,
          clips: Number(stat.clips),
          users: Number(stat.users),
        })),
        topUsers,
        processingStats: {
          avgTimeMs: processingStats._avg.processingTimeMs || 0,
          minTimeMs: processingStats._min.processingTimeMs || 0,
          maxTimeMs: processingStats._max.processingTimeMs || 0,
        }
      };
    }),
});