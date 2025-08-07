import { describe, it, expect, beforeEach, vi } from 'vitest';
import { clipRouter } from '@/lib/trpc/routers/clip';
import { 
  prismaMock, 
  createMockUser, 
  createMockVOD, 
  createMockClip,
  setupCommonMocks 
} from '../mocks/prisma';

// Create a mock context
const createMockContext = (clerkUserId?: string) => ({
  auth: clerkUserId ? { userId: clerkUserId } : null,
  db: prismaMock,
});

describe('Clip Router', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('list', () => {
    it('should list all clips for authenticated user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockClips = [
        createMockClip({ vod: mockVOD }),
        createMockClip({ id: 'clip_test456', title: 'Another Highlight', vod: mockVOD }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10 });

      expect(result.clips).toHaveLength(2);
      expect(result.clips[0].title).toBe('Epic Gaming Moment');
      expect(result.nextCursor).toBeUndefined();
      
      expect(prismaMock.clip.findMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        take: 11,
        cursor: undefined,
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
      });
    });

    it('should filter clips by VOD ID', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockClips = [createMockClip({ vodId: 'vod_test123', vod: mockVOD })];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.list({ vodId: 'vod_test123', limit: 10 });

      expect(result.clips).toHaveLength(1);
      expect(prismaMock.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: mockUser.id,
            vodId: 'vod_test123',
          },
        })
      );
    });

    it('should paginate results correctly', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockClips = Array(11).fill(null).map((_, i) => 
        createMockClip({ id: `clip_${i}`, title: `Highlight ${i}`, vod: mockVOD })
      );
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10 });

      expect(result.clips).toHaveLength(10);
      expect(result.nextCursor).toBe('clip_10');
    });

    it('should handle cursor-based pagination', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockClips = [
        createMockClip({ id: 'clip_5', title: 'Highlight 5', vod: mockVOD }),
        createMockClip({ id: 'clip_6', title: 'Highlight 6', vod: mockVOD }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.list({ limit: 10, cursor: 'clip_4' });

      expect(prismaMock.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: { id: 'clip_4' },
        })
      );
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = clipRouter.createCaller(ctx);

      await expect(caller.list({ limit: 10 })).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = clipRouter.createCaller(ctx);

      await expect(caller.list({ limit: 10 })).rejects.toThrow();
      await expect(caller.list({ limit: 10 })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });
  });

  describe('create', () => {
    it('should validate time range (startTime must be less than endTime)', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = clipRouter.createCaller(ctx);

      // Test startTime > endTime
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Invalid Time Range',
        startTime: 200,
        endTime: 100,
        confidenceScore: 0.8,
      })).rejects.toThrow();

      // Test startTime === endTime
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Zero Duration',
        startTime: 100,
        endTime: 100,
        confidenceScore: 0.8,
      })).rejects.toThrow();
    });

    it('should validate title length and content', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.findMany.mockResolvedValue([]); // No overlapping clips
      prismaMock.clip.create.mockResolvedValue(createMockClip()); // Mock the create call

      const caller = clipRouter.createCaller(ctx);

      // Test empty title
      await expect(caller.create({
        vodId: 'vod_test123',
        title: '',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
      })).rejects.toThrow();

      // Test whitespace-only title
      await expect(caller.create({
        vodId: 'vod_test123',
        title: '   ',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
      })).rejects.toThrow();

      // Test very long title (assuming 200 char limit)
      const longTitle = 'a'.repeat(201);
      await expect(caller.create({
        vodId: 'vod_test123',
        title: longTitle,
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
      })).rejects.toThrow();
    });

    it('should detect and handle overlapping clips', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const existingClip = createMockClip({
        vodId: 'vod_test123',
        startTime: 100,
        endTime: 200,
        userId: mockUser.id,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.findMany.mockResolvedValue([existingClip]);

      const caller = clipRouter.createCaller(ctx);

      // Test clip that overlaps with existing (starts within existing)
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Overlapping Clip',
        startTime: 150,
        endTime: 250,
        confidenceScore: 0.8,
      })).rejects.toThrow('Overlapping clip detected');

      // Test clip that contains existing
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Containing Clip',
        startTime: 50,
        endTime: 250,
        confidenceScore: 0.8,
      })).rejects.toThrow('Overlapping clip detected');
    });

    it('should validate keywords array', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);

      const caller = clipRouter.createCaller(ctx);

      // Test too many keywords (assuming max 10)
      const tooManyKeywords = Array(11).fill('keyword');
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Too Many Keywords',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
        keywords: tooManyKeywords,
      })).rejects.toThrow();

      // Test empty string keywords
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Empty Keywords',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
        keywords: ['valid', '', 'another'],
      })).rejects.toThrow();

      // Test overly long keywords
      const longKeyword = 'a'.repeat(51); // assuming 50 char limit per keyword
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Long Keywords',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
        keywords: ['valid', longKeyword],
      })).rejects.toThrow();
    });

    it.skip('should handle maximum clip duration limits', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);

      const caller = clipRouter.createCaller(ctx);

      // Test clip duration exceeding max (e.g., 5 minutes = 300 seconds)
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Too Long Clip',
        startTime: 0,
        endTime: 301,
        confidenceScore: 0.8,
      })).rejects.toThrow('Clip duration exceeds maximum allowed');
    });

    it('should create a new clip', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const input = {
        vodId: 'vod_test123',
        title: 'Amazing Play',
        startTime: 600,
        endTime: 645,
        confidenceScore: 0.92,
        highlightReason: 'High chat activity spike',
        keywords: ['poggers', 'amazing', 'clutch'],
      };
      
      const mockClip = createMockClip({
        ...input,
        userId: mockUser.id,
        duration: 45,
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.findMany.mockResolvedValue([]); // No overlapping clips
      prismaMock.clip.create.mockResolvedValue(mockClip);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.create(input);

      expect(result).toMatchObject({
        ...input,
        duration: 45,
      });
      
      expect(prismaMock.clip.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId: mockUser.id,
          keywords: input.keywords,
          duration: 45,
        },
      });
    });

    it('should create clip without optional fields', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      const input = {
        vodId: 'vod_test123',
        title: 'Quick Highlight',
        startTime: 100,
        endTime: 130,
        confidenceScore: 0.75,
      };
      
      const mockClip = createMockClip({
        ...input,
        userId: mockUser.id,
        duration: 30,
        keywords: [],
      });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      prismaMock.clip.findMany.mockResolvedValue([]); // No overlapping clips
      prismaMock.clip.create.mockResolvedValue(mockClip);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.create(input);

      expect(result).toBeDefined();
      expect(prismaMock.clip.create).toHaveBeenCalledWith({
        data: {
          ...input,
          userId: mockUser.id,
          keywords: [],
          duration: 30,
        },
      });
    });

    it('should validate confidence score range', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = clipRouter.createCaller(ctx);

      // Test confidence score > 1
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Invalid Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: 1.5,
      })).rejects.toThrow();

      // Test confidence score < 0
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Invalid Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: -0.1,
      })).rejects.toThrow();
    });

    it('should throw error if VOD not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null);

      const caller = clipRouter.createCaller(ctx);

      await expect(caller.create({
        vodId: 'nonexistent',
        title: 'Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: 0.8,
      })).rejects.toThrow();
      
      await expect(caller.create({
        vodId: 'nonexistent',
        title: 'Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: 0.8,
      })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'VOD not found or unauthorized',
      });
    });

    it('should not create clip for VOD owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(null); // VOD not found for this user

      const caller = clipRouter.createCaller(ctx);

      await expect(caller.create({
        vodId: 'vod_other_user',
        title: 'Unauthorized Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: 0.8,
      })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'VOD not found or unauthorized',
      });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = clipRouter.createCaller(ctx);

      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Clip',
        startTime: 100,
        endTime: 130,
        confidenceScore: 0.8,
      })).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete a clip', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockClip = createMockClip({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(mockClip);
      prismaMock.clip.delete.mockResolvedValue(mockClip);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.delete({ id: 'clip_test123' });

      expect(result.success).toBe(true);
      expect(prismaMock.clip.delete).toHaveBeenCalledWith({
        where: { id: 'clip_test123' },
      });
    });

    it('should throw error if clip not found', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(null);

      const caller = clipRouter.createCaller(ctx);
      
      await expect(caller.delete({ id: 'nonexistent' })).rejects.toThrow();
      await expect(caller.delete({ id: 'nonexistent' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Clip not found or unauthorized',
      });
    });

    it('should not delete clip owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(null); // Clip not found for this user

      const caller = clipRouter.createCaller(ctx);
      
      await expect(caller.delete({ id: 'clip_other_user' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Clip not found or unauthorized',
      });
    });

    it('should throw error for unauthenticated user', async () => {
      const ctx = createMockContext();
      const caller = clipRouter.createCaller(ctx);

      await expect(caller.delete({ id: 'clip_test123' })).rejects.toThrow();
    });

    it('should throw error if user not found in database', async () => {
      const ctx = createMockContext('clerk_user_123');
      prismaMock.user.findUnique.mockResolvedValue(null);

      const caller = clipRouter.createCaller(ctx);

      await expect(caller.delete({ id: 'clip_test123' })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    });

    it('should handle database errors gracefully', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockClip = createMockClip({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(mockClip);
      prismaMock.clip.delete.mockRejectedValue(new Error('Database error'));

      const caller = clipRouter.createCaller(ctx);
      
      await expect(caller.delete({ id: 'clip_test123' })).rejects.toThrow('Database error');
    });
  });

  describe('update', () => {
    it.skip('should update clip title and keywords', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockClip = createMockClip({ userId: mockUser.id });
      const updatedClip = { ...mockClip, title: 'Updated Title', keywords: ['new', 'keywords'] };
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(mockClip);
      prismaMock.clip.update.mockResolvedValue(updatedClip);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.update({
        id: 'clip_test123',
        title: 'Updated Title',
        keywords: ['new', 'keywords'],
      });

      expect(result.title).toBe('Updated Title');
      expect(result.keywords).toEqual(['new', 'keywords']);
      expect(prismaMock.clip.update).toHaveBeenCalledWith({
        where: { id: 'clip_test123' },
        data: {
          title: 'Updated Title',
          keywords: ['new', 'keywords'],
        },
      });
    });

    it.skip('should not update clip owned by another user', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findFirst.mockResolvedValue(null); // Not found for this user

      const caller = clipRouter.createCaller(ctx);
      
      await expect(caller.update({
        id: 'clip_other_user',
        title: 'Hacked Title',
      })).rejects.toMatchObject({
        code: 'NOT_FOUND',
        message: 'Clip not found or unauthorized',
      });
    });
  });

  describe('bulk operations', () => {
    it.skip('should delete multiple clips at once', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.deleteMany.mockResolvedValue({ count: 3 });

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.bulkDelete({
        ids: ['clip_1', 'clip_2', 'clip_3'],
      });

      expect(result.deletedCount).toBe(3);
      expect(prismaMock.clip.deleteMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['clip_1', 'clip_2', 'clip_3'] },
          userId: mockUser.id,
        },
      });
    });

    it.skip('should limit bulk delete operations', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const caller = clipRouter.createCaller(ctx);
      const tooManyIds = Array(101).fill(null).map((_, i) => `clip_${i}`);
      
      await expect(caller.bulkDelete({
        ids: tooManyIds,
      })).rejects.toThrow('Cannot delete more than 100 clips at once');
    });
  });

  describe('export operations', () => {
    it.skip('should export clips in different formats', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockClips = [
        createMockClip({ userId: mockUser.id }),
        createMockClip({ id: 'clip_2', userId: mockUser.id }),
      ];
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);

      const caller = clipRouter.createCaller(ctx);
      
      // Test CSV export
      const csvResult = await caller.export({ format: 'csv' });
      expect(csvResult.format).toBe('csv');
      expect(csvResult.data).toContain('title,startTime,endTime');
      
      // Test JSON export
      const jsonResult = await caller.export({ format: 'json' });
      expect(jsonResult.format).toBe('json');
      expect(JSON.parse(jsonResult.data)).toHaveLength(2);
    });
  });

  describe('performance and rate limiting', () => {
    it.skip('should handle rate limiting gracefully', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      
      // Simulate rate limit by checking recent operations
      prismaMock.clip.count.mockResolvedValue(100); // User has created 100 clips in last hour

      const caller = clipRouter.createCaller(ctx);
      
      await expect(caller.create({
        vodId: 'vod_test123',
        title: 'Rate Limited Clip',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
      })).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle large dataset pagination efficiently', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD();
      const mockClips = Array(50).fill(null).map((_, i) => 
        createMockClip({ id: `clip_${i}`, vod: mockVOD })
      );
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue(mockClips);
      
      // Mock count for total clips
      prismaMock.clip.count.mockResolvedValue(10000);
      
      const caller = clipRouter.createCaller(ctx);
      const result = await caller.list({ limit: 50 });
      
      // Verify proper limit is applied
      expect(prismaMock.clip.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 51, // 50 + 1 for cursor
        })
      );
    });
  });

  describe('sanitization and security', () => {
    it.skip('should sanitize HTML in title and description', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      const mockVOD = createMockVOD({ userId: mockUser.id });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.vOD.findFirst.mockResolvedValue(mockVOD);
      
      const maliciousInput = {
        vodId: 'vod_test123',
        title: '<script>alert("XSS")</script>Epic Moment',
        description: '<img src=x onerror=alert("XSS")>',
        startTime: 100,
        endTime: 200,
        confidenceScore: 0.8,
      };
      
      const sanitizedClip = createMockClip({
        ...maliciousInput,
        title: 'Epic Moment', // Script tags removed
        description: '', // Malicious img removed
        userId: mockUser.id,
      });
      
      prismaMock.clip.create.mockResolvedValue(sanitizedClip);

      const caller = clipRouter.createCaller(ctx);
      const result = await caller.create(maliciousInput);
      
      expect(result.title).toBe('Epic Moment');
      expect(result.description).toBe('');
      expect(result.title).not.toContain('<script>');
      expect(result.description).not.toContain('onerror');
    });

    it('should prevent SQL injection in search queries', async () => {
      const ctx = createMockContext('clerk_user_123');
      const mockUser = createMockUser({ clerkId: 'clerk_user_123' });
      
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      prismaMock.clip.findMany.mockResolvedValue([]);

      const caller = clipRouter.createCaller(ctx);
      
      // Attempt SQL injection in search
      const result = await caller.list({
        search: "'; DROP TABLE clips; --",
        limit: 10,
      });
      
      // Should handle safely without executing malicious SQL
      expect(result.clips).toEqual([]);
      expect(prismaMock.clip.findMany).toHaveBeenCalled();
    });
  });
});