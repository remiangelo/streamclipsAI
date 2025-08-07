import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processingRouter } from '@/lib/trpc/routers/processing';
import { 
  prismaMock, 
  createMockUser, 
  createMockVOD, 
  createMockClip,
  createMockProcessingJob,
  setupCommonMocks 
} from '../mocks/prisma';

// Create a mock context
const createMockContext = (clerkUserId?: string) => ({
  auth: clerkUserId ? { userId: clerkUserId } : null,
  db: prismaMock,
});

describe('Processing Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  describe('startVodProcessing', () => {
    it('should start VOD processing job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        processingQuota: 10,
        subscriptionTier: 'starter'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        vodId: mockVOD.id,
        jobType: 'chat_analysis',
        status: 'pending',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(3); // Under quota
      prismaMock.processingJob.create.mockResolvedValue(mockJob);
      prismaMock.vOD.update.mockResolvedValue({
        ...mockVOD,
        processingStatus: 'analyzing_chat',
      });

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.startVodProcessing({ vodId: 'vod_test123' });

      expect(result.jobId).toBe(mockJob.id);
      
      expect(prismaMock.processingJob.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          vodId: 'vod_test123',
          jobType: 'chat_analysis',
          status: 'pending',
          priority: 'medium', // starter tier gets medium priority
        },
      });
      
      expect(prismaMock.vOD.update).toHaveBeenCalledWith({
        where: { id: 'vod_test123' },
        data: { processingStatus: 'analyzing_chat' },
      });
    });

    it('should check monthly quota before starting job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        processingQuota: 5,
        subscriptionTier: 'free'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(5); // At quota limit

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toThrow();
      
      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toMatchObject({
          code: 'FORBIDDEN',
          message: 'Monthly processing quota exceeded',
        });
    });

    it('should allow unlimited processing for studio tier', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        processingQuota: 100,
        subscriptionTier: 'studio'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const mockJob = createMockProcessingJob();
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(150); // Over normal quota
      prismaMock.processingJob.create.mockResolvedValue(mockJob);
      prismaMock.vOD.update.mockResolvedValue({
        ...mockVOD,
        processingStatus: 'analyzing_chat',
      });

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.startVodProcessing({ vodId: 'vod_test123' });

      expect(result.jobId).toBe(mockJob.id);
      expect(prismaMock.processingJob.create).toHaveBeenCalled();
    });

    it('should count clips from current month only', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(2);

      const caller = processingRouter.createCaller(ctx);
      
      // Verify the date calculation for current month
      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);
      
      await caller.startVodProcessing({ vodId: 'vod_test123' });
      
      expect(prismaMock.clip.count).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it('should throw error if VOD not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'nonexistent' }))
        .rejects.toThrow();
      
      await expect(caller.startVodProcessing({ vodId: 'nonexistent' }))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'VOD not found or unauthorized',
        });
    });

    it('should not process VOD owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null); // VOD not found for this user

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'vod_other_user' }))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'VOD not found or unauthorized',
        });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = processingRouter.createCaller(ctx);

      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = processingRouter.createCaller(ctx);

      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'User not found',
        });
    });
  });

  describe('getJobStatus', () => {
    it('should get job status with VOD details', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({
        processingStatus: 'analyzing_chat',
        processingProgress: 45,
      });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        vod: mockVOD,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.getJobStatus({ jobId: 'job_test123' });

      expect(result).toMatchObject(mockJob);
      expect(result.vod.processingStatus).toBe('analyzing_chat');
      expect(result.vod.processingProgress).toBe(45);
      
      expect(prismaMock.processingJob.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'job_test123',
          userId: mockUser.id,
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
      });
    });

    it('should throw error if job not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(null);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.getJobStatus({ jobId: 'nonexistent' }))
        .rejects.toThrow();
      
      await expect(caller.getJobStatus({ jobId: 'nonexistent' }))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'Job not found or unauthorized',
        });
    });

    it('should not return job owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(null); // Job not found for this user

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.getJobStatus({ jobId: 'job_other_user' }))
        .rejects.toMatchObject({
          code: 'NOT_FOUND',
          message: 'Job not found or unauthorized',
        });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = processingRouter.createCaller(ctx);

      await expect(caller.getJobStatus({ jobId: 'job_test123' }))
        .rejects.toThrow();
    });
  });

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'pending',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);
      prismaMock.processingJob.update.mockResolvedValue({
        ...mockJob,
        status: 'cancelled',
      });

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.cancelJob({ jobId: 'job_test123' });

      expect(result.success).toBe(true);
      expect(prismaMock.processingJob.update).toHaveBeenCalledWith({
        where: { id: 'job_test123' },
        data: { status: 'cancelled' },
      });
    });

    it('should not cancel a running job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'running',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.cancelJob({ jobId: 'job_test123' }))
        .rejects.toThrow('Cannot cancel a running job');
    });

    it('should not cancel completed or failed jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = processingRouter.createCaller(ctx);

      // Test completed job
      const completedJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'completed',
      });
      prismaMock.processingJob.findFirst.mockResolvedValue(completedJob);
      
      await expect(caller.cancelJob({ jobId: 'job_completed' }))
        .rejects.toThrow('Job is already completed');

      // Test failed job
      const failedJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'failed',
      });
      prismaMock.processingJob.findFirst.mockResolvedValue(failedJob);
      
      await expect(caller.cancelJob({ jobId: 'job_failed' }))
        .rejects.toThrow('Job has already failed');
    });
  });

  describe('retryJob', () => {
    it('should retry a failed job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'failed',
        retryCount: 1,
      });
      const newJob = createMockProcessingJob({
        id: 'job_retry123',
        userId: mockUser.id,
        status: 'pending',
        retryCount: 2,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);
      prismaMock.processingJob.create.mockResolvedValue(newJob);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.retryJob({ jobId: 'job_test123' });

      expect(result.newJobId).toBe('job_retry123');
      expect(prismaMock.processingJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          retryCount: 2,
          status: 'pending',
        }),
      });
    });

    it('should not retry job exceeding max retry limit', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'failed',
        retryCount: 3, // Already at max retries
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.retryJob({ jobId: 'job_test123' }))
        .rejects.toThrow('Maximum retry limit reached');
    });

    it('should only retry failed jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'completed',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(mockJob);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.retryJob({ jobId: 'job_test123' }))
        .rejects.toThrow('Can only retry failed jobs');
    });
  });

  describe('concurrent job limits', () => {
    it('should prevent starting new job if user has too many concurrent jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'free'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(1); // Under monthly quota
      prismaMock.processingJob.count.mockResolvedValue(2); // 2 active jobs (free tier limit)

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toThrow('Concurrent job limit exceeded');
    });

    it('should allow more concurrent jobs for higher tiers', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'studio'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const mockJob = createMockProcessingJob();
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(50); // Within studio tier limits
      prismaMock.processingJob.count
        .mockResolvedValueOnce(4) // 4 active jobs (under limit of 5)
        .mockResolvedValueOnce(10); // System has 10 total jobs
      prismaMock.processingJob.create.mockResolvedValue(mockJob);
      prismaMock.vOD.update.mockResolvedValue({
        ...mockVOD,
        processingStatus: 'analyzing_chat',
      });

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.startVodProcessing({ vodId: 'vod_test123' });

      expect(result.jobId).toBe(mockJob.id);
    });
  });

  describe('already processed VODs', () => {
    it('should prevent reprocessing a VOD that was already processed', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ 
        userId: mockUser.id,
        processingStatus: 'completed'
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toThrow('VOD has already been processed');
    });

    it('should allow reprocessing if explicitly requested', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ 
        userId: mockUser.id,
        processingStatus: 'completed'
      });
      const mockJob = createMockProcessingJob();
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(1);
      prismaMock.processingJob.create.mockResolvedValue(mockJob);
      prismaMock.vOD.update.mockResolvedValue({
        ...mockVOD,
        processingStatus: 'analyzing_chat',
      });

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.startVodProcessing({ 
        vodId: 'vod_test123',
        forceReprocess: true 
      });

      expect(result.jobId).toBe(mockJob.id);
    });
  });

  describe('job timeout handling', () => {
    it('should mark stale running jobs as timed out', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 2); // 2 hours ago
      
      const staleJob = createMockProcessingJob({
        userId: mockUser.id,
        status: 'running',
        startedAt: oldDate,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findFirst.mockResolvedValue(staleJob);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.getJobStatus({ jobId: 'job_test123' });

      // Should detect the job has timed out
      expect(result.status).toBe('failed');
      expect(result.error).toContain('timeout');
    });
  });

  describe('queue management', () => {
    it('should prioritize jobs based on subscription tier', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'studio'
      });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const mockJob = createMockProcessingJob({
        priority: 'high',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(0);
      prismaMock.processingJob.create.mockResolvedValue(mockJob);
      prismaMock.vOD.update.mockResolvedValue({
        ...mockVOD,
        processingStatus: 'analyzing_chat',
      });

      const caller = processingRouter.createCaller(ctx);
      await caller.startVodProcessing({ vodId: 'vod_test123' });

      expect(prismaMock.processingJob.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          priority: 'high',
        }),
      });
    });

    it('should handle system overload gracefully', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.count.mockResolvedValue(0);
      // Mock concurrent jobs check and system overload check separately
      prismaMock.processingJob.count
        .mockResolvedValueOnce(0) // User has 0 concurrent jobs
        .mockResolvedValueOnce(1000); // System has 1000 total jobs

      const caller = processingRouter.createCaller(ctx);
      
      await expect(caller.startVodProcessing({ vodId: 'vod_test123' }))
        .rejects.toThrow('System is currently overloaded. Please try again later.');
    });
  });

  describe('listActiveJobs', () => {
    it('should list active jobs for user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockJobs = [
        createMockProcessingJob({
          userId: mockUser.id,
          status: 'pending',
          vod: mockVOD,
        }),
        createMockProcessingJob({
          id: 'job_test456',
          userId: mockUser.id,
          status: 'running',
          vod: mockVOD,
        }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findMany.mockResolvedValue(mockJobs);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.listActiveJobs();

      expect(result).toHaveLength(2);
      expect(result[0].status).toBe('pending');
      expect(result[1].status).toBe('running');
      
      expect(prismaMock.processingJob.findMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
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
      });
    });

    it('should not include completed or failed jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockJobs = [
        createMockProcessingJob({
          userId: mockUser.id,
          status: 'pending',
          vod: mockVOD,
        }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findMany.mockResolvedValue(mockJobs);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.listActiveJobs();

      expect(result).toHaveLength(1);
      expect(prismaMock.processingJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUser.id,
            status: { in: ['pending', 'running'] },
          },
        })
      );
    });

    it('should return empty array if no active jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.findMany.mockResolvedValue([]);

      const caller = processingRouter.createCaller(ctx);
      const result = await caller.listActiveJobs();

      expect(result).toEqual([]);
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = processingRouter.createCaller(ctx);

      await expect(caller.listActiveJobs()).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = processingRouter.createCaller(ctx);

      await expect(caller.listActiveJobs()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });
});