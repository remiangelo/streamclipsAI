import { describe, it, expect, beforeEach, vi } from 'vitest';
import { userRouter } from '@/lib/trpc/routers/user';
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

describe('User Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  describe('me', () => {
    it('should return current user with counts', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        _count: {
          vods: 5,
          clips: 12,
        }
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.me();

      expect(result).toMatchObject({
        clerkId: 'clerk_user_123',
        email: 'test@example.com',
        username: 'testuser',
        _count: {
          vods: 5,
          clips: 12,
        },
      });
      
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { clerkId: 'clerk_user_123' },
        include: {
          _count: {
            select: {
              vods: true,
              clips: true,
            },
          },
        },
      });
    });

    it('should include all user fields', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        displayName: 'Test User',
        twitchId: 'twitch123',
        twitchUsername: 'teststreamer',
        subscriptionTier: 'pro',
        role: 'user',
        monthlyClipCount: 8,
        totalClipCount: 45,
        _count: {
          vods: 10,
          clips: 45,
        }
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.me();

      expect(result.displayName).toBe('Test User');
      expect(result.twitchUsername).toBe('teststreamer');
      expect(result.subscriptionTier).toBe('pro');
      expect(result.totalClipCount).toBe(45);
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = userRouter.createCaller(ctx);

      await expect(caller.me()).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = userRouter.createCaller(ctx);

      await expect(caller.me()).rejects.toThrow();
      await expect(caller.me()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });

  describe('stats', () => {
    it('should return comprehensive user statistics', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        creditsRemaining: 100,
        processingQuota: 20,
        subscriptionTier: 'starter',
      });
      const mockVOD = createMockVOD();
      const mockClips = [
        createMockClip({ vod: mockVOD }),
        createMockClip({ id: 'clip_2', title: 'Highlight 2', vod: mockVOD }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count
        .mockResolvedValueOnce(45) // totalClips
        .mockResolvedValueOnce(8); // monthlyClips
      prismaMock.vOD.count.mockResolvedValue(10);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);
      prismaMock.processingJob.count.mockResolvedValue(2);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.stats();

      expect(result).toMatchObject({
        totalClips: 45,
        totalVods: 10,
        monthlyClips: 8,
        processingJobs: 2,
        recentClips: mockClips,
        creditsRemaining: 100,
        processingQuota: 20,
        subscriptionTier: 'starter',
      });
    });

    it('should return recent clips with VOD details', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({
        title: 'Epic Stream',
        thumbnailUrl: 'https://example.com/thumb.jpg',
      });
      const mockClips = Array(5).fill(null).map((_, i) => 
        createMockClip({ 
          id: `clip_${i}`, 
          title: `Highlight ${i}`,
          vod: mockVOD,
        })
      );
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count.mockResolvedValue(0);
      prismaMock.vOD.count.mockResolvedValue(0);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);
      prismaMock.processingJob.count.mockResolvedValue(0);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.stats();

      expect(result.recentClips).toHaveLength(5);
      expect(result.recentClips[0].vod.title).toBe('Epic Stream');
      
      expect(prismaMock.clip.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
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

    it('should count only active processing jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count.mockResolvedValue(0);
      prismaMock.vOD.count.mockResolvedValue(0);
      prismaMock.clip.findMany.mockResolvedValue([]);
      prismaMock.processingJob.count.mockResolvedValue(3);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.stats();

      expect(result.processingJobs).toBe(3);
      expect(prismaMock.processingJob.count).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          status: { in: ['pending', 'running'] },
        },
      });
    });

    it('should calculate monthly clips from current month start', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count
        .mockResolvedValueOnce(100) // totalClips
        .mockResolvedValueOnce(15); // monthlyClips
      prismaMock.vOD.count.mockResolvedValue(0);
      prismaMock.clip.findMany.mockResolvedValue([]);
      prismaMock.processingJob.count.mockResolvedValue(0);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.stats();

      const currentMonth = new Date();
      currentMonth.setDate(1);
      currentMonth.setHours(0, 0, 0, 0);

      expect(result.monthlyClips).toBe(15);
      
      // Verify the monthly count was called with correct date filter
      expect(prismaMock.clip.count).toHaveBeenNthCalledWith(2, {
        where: {
          userId: mockUser.id,
          createdAt: { gte: expect.any(Date) },
        },
      });
    });

    it('should handle users with no data gracefully', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        creditsRemaining: 0,
        processingQuota: 5,
        subscriptionTier: 'free',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count.mockResolvedValue(0);
      prismaMock.vOD.count.mockResolvedValue(0);
      prismaMock.clip.findMany.mockResolvedValue([]);
      prismaMock.processingJob.count.mockResolvedValue(0);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.stats();

      expect(result).toMatchObject({
        totalClips: 0,
        totalVods: 0,
        monthlyClips: 0,
        processingJobs: 0,
        recentClips: [],
        creditsRemaining: 0,
        processingQuota: 5,
        subscriptionTier: 'free',
      });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = userRouter.createCaller(ctx);

      await expect(caller.stats()).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = userRouter.createCaller(ctx);

      await expect(caller.stats()).rejects.toThrow();
      await expect(caller.stats()).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should execute all queries in parallel', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      // Set up all mocks to resolve with delays to test parallelization
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(10), 10))
      );
      prismaMock.vOD.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(5), 10))
      );
      prismaMock.clip.findMany.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 10))
      );
      prismaMock.processingJob.count.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(2), 10))
      );

      const caller = userRouter.createCaller(ctx);
      const startTime = Date.now();
      await caller.stats();
      const endTime = Date.now();

      // If queries run in parallel, total time should be ~10ms (not 40ms)
      expect(endTime - startTime).toBeLessThan(30);
    });
  });

  describe('update', () => {
    it('should update user profile', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const updatedUser = {
        ...mockUser,
        displayName: 'Updated Name',
        bio: 'New bio text',
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(updatedUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.update({
        displayName: 'Updated Name',
        bio: 'New bio text',
      });

      expect(result.displayName).toBe('Updated Name');
      expect(result.bio).toBe('New bio text');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          displayName: 'Updated Name',
          bio: 'New bio text',
        },
      });
    });

    it('should validate display name length', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(ctx);
      
      // Test empty name
      await expect(caller.update({ displayName: '' }))
        .rejects.toThrow('Display name cannot be empty');

      // Test name too long
      const longName = 'a'.repeat(51);
      await expect(caller.update({ displayName: longName }))
        .rejects.toThrow('Display name too long');
    });

    it('should sanitize user input', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const sanitizedUser = {
        ...mockUser,
        displayName: 'Safe Name',
        bio: 'Safe bio',
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(sanitizedUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.update({
        displayName: '<script>alert("XSS")</script>Safe Name',
        bio: '<img src=x onerror=alert("XSS")>Safe bio',
      });

      expect(result.displayName).toBe('Safe Name');
      expect(result.bio).toBe('Safe bio');
    });
  });

  describe('subscription management', () => {
    it('should upgrade subscription tier', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'free',
      });
      const upgradedUser = {
        ...mockUser,
        subscriptionTier: 'pro',
        processingQuota: 50,
        creditsRemaining: 500,
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(upgradedUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.upgradeSubscription({
        tier: 'pro',
        paymentIntentId: 'pi_123',
      });

      expect(result.subscriptionTier).toBe('pro');
      expect(result.processingQuota).toBe(50);
      expect(result.creditsRemaining).toBe(500);
    });

    it('should handle downgrade with active jobs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'pro',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.count.mockResolvedValue(3); // Active jobs

      const caller = userRouter.createCaller(ctx);
      
      await expect(caller.downgradeSubscription({ tier: 'free' }))
        .rejects.toThrow('Cannot downgrade with active processing jobs');
    });

    it('should refresh monthly quotas', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        subscriptionTier: 'starter',
        monthlyClipCount: 20,
      });
      const refreshedUser = {
        ...mockUser,
        monthlyClipCount: 0,
        creditsRemaining: mockUser.processingQuota,
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(refreshedUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.refreshMonthlyQuota();

      expect(result.monthlyClipCount).toBe(0);
      expect(result.creditsRemaining).toBe(mockUser.processingQuota);
    });
  });

  describe('Twitch integration', () => {
    it('should connect Twitch account', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        twitchId: null,
        twitchUsername: null,
      });
      const connectedUser = {
        ...mockUser,
        twitchId: 'twitch_123',
        twitchUsername: 'streamer123',
        twitchAccessToken: 'encrypted_token',
        twitchRefreshToken: 'encrypted_refresh',
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue(connectedUser);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.connectTwitch({
        code: 'auth_code_123',
        state: 'state_123',
      });

      expect(result.twitchUsername).toBe('streamer123');
      expect(result.twitchId).toBe('twitch_123');
    });

    it('should disconnect Twitch account', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ 
        clerkId: 'clerk_user_123',
        twitchId: 'twitch_123',
        twitchUsername: 'streamer123',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.count.mockResolvedValue(0); // No active jobs
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        twitchId: null,
        twitchUsername: null,
        twitchAccessToken: null,
        twitchRefreshToken: null,
      });

      const caller = userRouter.createCaller(ctx);
      const result = await caller.disconnectTwitch();

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          twitchId: null,
          twitchUsername: null,
          twitchAccessToken: null,
          twitchRefreshToken: null,
        },
      });
    });

    it('should not disconnect with active processing', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.count.mockResolvedValue(1); // Has active job

      const caller = userRouter.createCaller(ctx);
      
      await expect(caller.disconnectTwitch())
        .rejects.toThrow('Cannot disconnect while processing is active');
    });
  });

  describe('data export', () => {
    it('should export user data in JSON format', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVODs = [createMockVOD({ userId: mockUser.id })];
      const mockClips = [createMockClip({ userId: mockUser.id })];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue(mockVODs);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.exportData({ format: 'json' });

      expect(result.format).toBe('json');
      const data = JSON.parse(result.data);
      expect(data).toHaveProperty('user');
      expect(data).toHaveProperty('vods');
      expect(data).toHaveProperty('clips');
      expect(data.vods).toHaveLength(1);
      expect(data.clips).toHaveLength(1);
    });

    it('should export user data in CSV format', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockClips = [
        createMockClip({ 
          userId: mockUser.id,
          title: 'Clip 1',
          startTime: 100,
          endTime: 150,
        }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);
      prismaMock.vOD.findMany.mockResolvedValue([]);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.exportData({ format: 'csv' });

      expect(result.format).toBe('csv');
      expect(result.data).toContain('title,startTime,endTime');
      expect(result.data).toContain('Clip 1,100,150');
    });
  });

  describe('deletion and deactivation', () => {
    it('should soft delete user account', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.processingJob.count.mockResolvedValue(0); // No active jobs
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        deletedAt: new Date(),
        status: 'deleted',
      });

      const caller = userRouter.createCaller(ctx);
      const result = await caller.deleteAccount({ 
        confirmation: 'DELETE MY ACCOUNT',
      });

      expect(result.success).toBe(true);
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          deletedAt: expect.any(Date),
          status: 'deleted',
        },
      });
    });

    it('should not delete with wrong confirmation', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = userRouter.createCaller(ctx);
      
      await expect(caller.deleteAccount({ 
        confirmation: 'delete account',
      })).rejects.toThrow('Invalid confirmation');
    });

    it('should schedule account deletion after grace period', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const scheduledDate = new Date();
      scheduledDate.setDate(scheduledDate.getDate() + 30); // 30 days grace period
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.user.update.mockResolvedValue({
        ...mockUser,
        scheduledDeletionDate: scheduledDate,
        status: 'pending_deletion',
      });

      const caller = userRouter.createCaller(ctx);
      const result = await caller.scheduleAccountDeletion();

      expect(result.scheduledDate).toEqual(scheduledDate);
      expect(result.canCancel).toBe(true);
    });
  });

  describe('admin operations', () => {
    it('should allow admin to view any user stats', async () => {
      const ctx = createMockContext('admin_clerk_id');
      const adminUser = createMockUser({ 
        clerkId: 'admin_clerk_id',
        role: 'admin',
      });
      const targetUser = createMockUser({ 
        id: 'target_user_id',
        clerkId: 'target_clerk_id',
      });
      
      prismaMock.user.findUnique
        .mockResolvedValueOnce(adminUser) // First call for auth check
        .mockResolvedValueOnce(targetUser); // Second call for target user
      
      prismaMock.clip.count.mockResolvedValue(10);
      prismaMock.vOD.count.mockResolvedValue(5);
      prismaMock.clip.findMany.mockResolvedValue([]);
      prismaMock.processingJob.count.mockResolvedValue(0);

      const caller = userRouter.createCaller(ctx);
      const result = await caller.adminGetUserStats({ 
        userId: 'target_user_id',
      });

      expect(result.totalClips).toBe(10);
      expect(result.totalVods).toBe(5);
    });

    it('should not allow non-admin to use admin endpoints', async () => {
      const ctx = createMockContext('user_clerk_id');
      const regularUser = createMockUser({ 
        clerkId: 'user_clerk_id',
        role: 'user',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(regularUser);

      const caller = userRouter.createCaller(ctx);
      
      await expect(caller.adminGetUserStats({ 
        userId: 'other_user_id',
      })).rejects.toThrow('Unauthorized');
    });
  });
});