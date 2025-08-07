import { describe, it, expect, beforeEach, vi } from 'vitest';
import { vodRouter } from '@/lib/trpc/routers/vod';
import { 
  prismaMock, 
  createMockUser, 
  createMockVOD, 
  setupCommonMocks 
} from '../mocks/prisma';

// Create a mock context
const createMockContext = (clerkUserId?: string) => ({
  auth: clerkUserId ? { userId: clerkUserId } : null,
  db: prismaMock,
});

describe('VOD Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupCommonMocks();
  });

  describe('list', () => {
    it('should list VODs for authenticated user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVODs = [
        createMockVOD(),
        createMockVOD({ id: 'vod_test456', title: 'Another Stream' }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue(mockVODs);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10 });

      expect(result.vods).toHaveLength(2);
      expect(result.vods[0].title).toBe('Test Stream VOD');
      expect(result.nextCursor).toBeUndefined();
      
      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        take: 11,
        cursor: undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { clips: true },
          },
        },
      });
    });

    it('should paginate results correctly', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVODs = Array(11).fill(null).map((_, i) => 
        createMockVOD({ id: `vod_${i}`, title: `Stream ${i}` })
      );
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue(mockVODs);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10 });

      expect(result.vods).toHaveLength(10);
      expect(result.nextCursor).toBe('vod_10');
    });

    it('should handle cursor-based pagination', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVODs = [
        createMockVOD({ id: 'vod_5', title: 'Stream 5' }),
        createMockVOD({ id: 'vod_6', title: 'Stream 6' }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue(mockVODs);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10, cursor: 'vod_4' });

      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'vod_4' },
        })
      );
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = vodRouter.createCaller(ctx);

      await expect(caller.list({ limit: 10 })).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = vodRouter.createCaller(ctx);

      await expect(caller.list({ limit: 10 })).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should create a new VOD', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const input = {
        twitchVodId: 'twitch_vod_999',
        title: 'New Stream VOD',
        duration: 7200,
        viewCount: 1500,
        gameCategory: 'Just Chatting',
        createdDate: new Date('2024-01-20'),
        thumbnailUrl: 'https://example.com/new-thumb.jpg',
        vodUrl: 'https://twitch.tv/videos/999',
      };
      
      const mockVOD = createMockVOD({ ...input, userId: mockUser.id });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.create.mockResolvedValue(mockVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.create(input);

      expect(result).toMatchObject(input);
      expect(prismaMock.vOD.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId: mockUser.id,
        },
      });
    });

    it('should create VOD without optional fields', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const input = {
        twitchVodId: 'twitch_vod_999',
        title: 'New Stream VOD',
        duration: 7200,
        createdDate: new Date('2024-01-20'),
      };
      
      const mockVOD = createMockVOD({ ...input, userId: mockUser.id });
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.create.mockResolvedValue(mockVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.create(input);

      expect(result).toBeDefined();
      expect(prismaMock.vOD.create).toHaveBeenCalled();
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = vodRouter.createCaller(ctx);

      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'New VOD',
        duration: 3600,
        createdDate: new Date(),
      })).rejects.toThrow();
    });

    it('should throw error if user not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = vodRouter.createCaller(ctx);

      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'New VOD',
        duration: 3600,
        createdDate: new Date(),
      })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });

  describe('get', () => {
    it('should get a VOD by ID', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.get({ id: 'vod_test123' });

      expect(result).toMatchObject(mockVOD);
      expect(prismaMock.vOD.findFirst).toHaveBeenCalledWith({
        where: { 
          id: 'vod_test123',
          userId: mockUser.id,
        },
        include: {
          clips: {
            orderBy: { confidenceScore: 'desc' },
          },
        },
      });
    });

    it('should throw error if VOD not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null);

      const caller = vodRouter.createCaller(ctx);
      
      await expect(caller.get({ id: 'nonexistent' })).rejects.toThrow();
    });

    it('should not return VOD owned by another user', async () => {
      const ctx = createMockContext('clerk_user_different');
      const mockUser = createMockUser({ 
        id: 'user_different', 
        clerkId: 'clerk_user_different' 
      });
      const mockVOD = createMockVOD({ userId: 'user_test123' }); // Different user's VOD
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null); // Won't find VOD for this user

      const caller = vodRouter.createCaller(ctx);
      
      await expect(caller.get({ id: 'vod_test123' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'VOD not found',
      });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = vodRouter.createCaller(ctx);

      await expect(caller.get({ id: 'vod_test123' })).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = vodRouter.createCaller(ctx);

      await expect(caller.get({ id: 'vod_test123' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });

  describe('create - edge cases', () => {
    it('should prevent duplicate VODs with same twitchVodId', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const existingVOD = createMockVOD({ 
        twitchVodId: 'twitch_vod_999',
        userId: mockUser.id 
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(existingVOD);

      const caller = vodRouter.createCaller(ctx);

      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Duplicate VOD',
        duration: 3600,
        createdDate: new Date(),
      })).rejects.toThrow('VOD already exists');
    });

    it('should validate VOD duration limits', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = vodRouter.createCaller(ctx);

      // Test negative duration
      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Invalid Duration',
        duration: -100,
        createdDate: new Date(),
      })).rejects.toThrow();

      // Test zero duration
      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Zero Duration',
        duration: 0,
        createdDate: new Date(),
      })).rejects.toThrow();

      // Test extremely long duration (> 24 hours)
      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Too Long',
        duration: 86401,
        createdDate: new Date(),
      })).rejects.toThrow('Duration exceeds maximum allowed');
    });

    it('should validate URL formats', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = vodRouter.createCaller(ctx);

      // Test invalid thumbnail URL
      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Invalid URLs',
        duration: 3600,
        createdDate: new Date(),
        thumbnailUrl: 'not-a-valid-url',
      })).rejects.toThrow('Invalid thumbnail URL');

      // Test invalid VOD URL
      await expect(caller.create({
        twitchVodId: 'twitch_vod_999',
        title: 'Invalid VOD URL',
        duration: 3600,
        createdDate: new Date(),
        vodUrl: 'javascript:alert("xss")',
      })).rejects.toThrow('Invalid VOD URL');
    });

    it('should sanitize title to prevent XSS', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      const maliciousTitle = '<script>alert("XSS")</script>Legitimate Title';
      const sanitizedVOD = createMockVOD({
        title: 'Legitimate Title', // Script removed
        userId: mockUser.id,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.create.mockResolvedValue(sanitizedVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.create({
        twitchVodId: 'twitch_vod_999',
        title: maliciousTitle,
        duration: 3600,
        createdDate: new Date(),
      });

      expect(result.title).toBe('Legitimate Title');
      expect(result.title).not.toContain('<script>');
    });
  });

  describe('update', () => {
    it('should update VOD metadata', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const updatedVOD = { 
        ...mockVOD, 
        gameCategory: 'Minecraft',
        viewCount: 2000 
      };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.vOD.update.mockResolvedValue(updatedVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.update({
        id: 'vod_test123',
        gameCategory: 'Minecraft',
        viewCount: 2000,
      });

      expect(result.gameCategory).toBe('Minecraft');
      expect(result.viewCount).toBe(2000);
      expect(prismaMock.vOD.update).toHaveBeenCalledWith({
        where: { id: 'vod_test123' },
        data: {
          gameCategory: 'Minecraft',
          viewCount: 2000,
        },
      });
    });

    it('should not update VOD owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null); // Not found for this user

      const caller = vodRouter.createCaller(ctx);
      
      await expect(caller.update({
        id: 'vod_other_user',
        gameCategory: 'Fortnite',
      })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'VOD not found or unauthorized',
      });
    });
  });

  describe('delete', () => {
    it('should delete VOD and cascade delete clips', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.vOD.delete.mockResolvedValue(mockVOD);

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.delete({ id: 'vod_test123' });

      expect(result.success).toBe(true);
      expect(prismaMock.vOD.delete).toHaveBeenCalledWith({
        where: { id: 'vod_test123' },
      });
    });

    it('should not delete VOD with active processing job', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ 
        userId: mockUser.id,
        processingStatus: 'analyzing_chat'
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);

      const caller = vodRouter.createCaller(ctx);
      
      await expect(caller.delete({ id: 'vod_test123' }))
        .rejects.toThrow('Cannot delete VOD while processing');
    });
  });

  describe('filtering and sorting', () => {
    it('should filter VODs by date range', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue([]);

      const caller = vodRouter.createCaller(ctx);
      await caller.list({ 
        limit: 10,
        startDate,
        endDate,
      });

      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUser.id,
            createdDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should filter VODs by game category', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue([]);

      const caller = vodRouter.createCaller(ctx);
      await caller.list({ 
        limit: 10,
        gameCategory: 'Just Chatting',
      });

      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUser.id,
            gameCategory: 'Just Chatting',
          },
        })
      );
    });

    it('should sort VODs by different fields', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue([]);

      const caller = vodRouter.createCaller(ctx);
      
      // Sort by view count
      await caller.list({ 
        limit: 10,
        sortBy: 'viewCount',
        sortOrder: 'desc',
      });

      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { viewCount: 'desc' },
        })
      );

      // Sort by duration
      await caller.list({ 
        limit: 10,
        sortBy: 'duration',
        sortOrder: 'asc',
      });

      expect(prismaMock.vOD.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { duration: 'asc' },
        })
      );
    });
  });

  describe('batch operations', () => {
    it('should import multiple VODs in batch', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const vodInputs = [
        {
          twitchVodId: 'twitch_vod_1',
          title: 'Stream 1',
          duration: 3600,
          createdDate: new Date(),
        },
        {
          twitchVodId: 'twitch_vod_2',
          title: 'Stream 2',
          duration: 7200,
          createdDate: new Date(),
        },
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.createMany.mockResolvedValue({ count: 2 });

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.batchImport({ vods: vodInputs });

      expect(result.importedCount).toBe(2);
      expect(prismaMock.vOD.createMany).toHaveBeenCalledWith({
        data: vodInputs.map(vod => ({
          ...vod,
          userId: mockUser.id,
        })),
        skipDuplicates: true,
      });
    });

    it('should limit batch import size', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const tooManyVods = Array(101).fill(null).map((_, i) => ({
        twitchVodId: `twitch_vod_${i}`,
        title: `Stream ${i}`,
        duration: 3600,
        createdDate: new Date(),
      }));
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = vodRouter.createCaller(ctx);
      
      await expect(caller.batchImport({ vods: tooManyVods }))
        .rejects.toThrow('Cannot import more than 100 VODs at once');
    });
  });

  describe('archival and expiration', () => {
    it('should archive old VODs', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 91); // 91 days ago
      
      const oldVODs = [
        createMockVOD({ 
          userId: mockUser.id,
          createdDate: oldDate,
        }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findMany.mockResolvedValue(oldVODs);
      prismaMock.vOD.updateMany.mockResolvedValue({ count: 1 });

      const caller = vodRouter.createCaller(ctx);
      const result = await caller.archiveOldVods({ daysOld: 90 });

      expect(result.archivedCount).toBe(1);
      expect(prismaMock.vOD.updateMany).toHaveBeenCalledWith({
        where: {
          userId: mockUser.id,
          createdDate: { lt: expect.any(Date) },
          archived: false,
        },
        data: {
          archived: true,
        },
      });
    });

    it('should handle VOD expiration from Twitch', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const expiredVOD = createMockVOD({ 
        userId: mockUser.id,
        vodUrl: 'https://twitch.tv/videos/expired',
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(expiredVOD);
      
      // Simulate Twitch API returning 404
      const caller = vodRouter.createCaller(ctx);
      const result = await caller.checkVodAvailability({ id: 'vod_test123' });

      expect(result.isAvailable).toBe(false);
      expect(result.reason).toBe('VOD no longer available on Twitch');
    });
  });
});