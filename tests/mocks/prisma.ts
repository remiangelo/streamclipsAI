import { vi } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'vitest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

beforeEach(() => {
  mockReset(prismaMock);
});

// Mock data generators
export const createMockUser = (overrides = {}) => ({
  id: 'user_test123',
  clerkId: 'user_test123',
  email: 'test@example.com',
  username: 'testuser',
  displayName: 'Test User',
  twitchId: 'twitch123',
  twitchUsername: 'teststreamer',
  subscriptionTier: 'free',
  role: 'user',
  monthlyClipCount: 0,
  totalClipCount: 0,
  lastClipGeneratedAt: null,
  subscriptionStartDate: new Date('2024-01-01'),
  subscriptionEndDate: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

export const createMockVOD = (overrides = {}) => ({
  id: 'vod_test123',
  userId: 'user_test123',
  twitchVodId: 'twitch_vod_123',
  title: 'Test Stream VOD',
  streamedAt: new Date('2024-01-15'),
  duration: 3600, // 1 hour
  viewCount: 1000,
  thumbnailUrl: 'https://example.com/thumbnail.jpg',
  vodUrl: 'https://twitch.tv/videos/123',
  status: 'ready',
  chatAnalyzed: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  user: createMockUser(),
  clips: [],
  processingJobs: [],
  ...overrides,
});

export const createMockClip = (overrides = {}) => ({
  id: 'clip_test123',
  userId: 'user_test123',
  vodId: 'vod_test123',
  title: 'Epic Gaming Moment',
  startTime: 300, // 5 minutes
  endTime: 330, // 5:30
  duration: 30,
  thumbnailUrl: 'https://example.com/clip-thumb.jpg',
  videoUrl: 'https://cdn.example.com/clip.mp4',
  platform: 'tiktok',
  aspectRatio: '9:16',
  resolution: '1080x1920',
  fileSize: 10485760, // 10MB
  score: 0.85,
  tags: ['gaming', 'epic', 'highlight'],
  published: false,
  publishedAt: null,
  viewCount: 0,
  likeCount: 0,
  commentCount: 0,
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-16'),
  user: createMockUser(),
  vod: createMockVOD(),
  ...overrides,
});

export const createMockProcessingJob = (overrides = {}) => ({
  id: 'job_test123',
  userId: 'user_test123',
  vodId: 'vod_test123',
  type: 'clip_generation',
  status: 'pending',
  priority: 1,
  metadata: {
    platform: 'tiktok',
    quality: 'high',
  },
  startedAt: null,
  completedAt: null,
  error: null,
  retries: 0,
  createdAt: new Date('2024-01-16'),
  updatedAt: new Date('2024-01-16'),
  user: createMockUser(),
  vod: createMockVOD(),
  ...overrides,
});

export const createMockUserAnalytics = (overrides = {}) => ({
  id: 'analytics_test123',
  userId: 'user_test123',
  date: new Date('2024-01-16'),
  clipsGenerated: 5,
  totalProcessingTime: 300,
  storageUsed: 52428800, // 50MB
  apiCalls: 10,
  user: createMockUser(),
  ...overrides,
});

// Common database query mocks
export const setupCommonMocks = () => {
  // User queries
  prismaMock.user.findUnique.mockResolvedValue(createMockUser());
  prismaMock.user.findFirst.mockResolvedValue(createMockUser());
  prismaMock.user.create.mockResolvedValue(createMockUser());
  prismaMock.user.update.mockResolvedValue(createMockUser());

  // VOD queries
  prismaMock.vOD.findMany.mockResolvedValue([createMockVOD()]);
  prismaMock.vOD.findUnique.mockResolvedValue(createMockVOD());
  prismaMock.vOD.create.mockResolvedValue(createMockVOD());
  prismaMock.vOD.update.mockResolvedValue(createMockVOD());

  // Clip queries
  prismaMock.clip.findMany.mockResolvedValue([createMockClip()]);
  prismaMock.clip.findUnique.mockResolvedValue(createMockClip());
  prismaMock.clip.create.mockResolvedValue(createMockClip());
  prismaMock.clip.delete.mockResolvedValue(createMockClip());

  // Processing job queries
  prismaMock.processingJob.findMany.mockResolvedValue([createMockProcessingJob()]);
  prismaMock.processingJob.create.mockResolvedValue(createMockProcessingJob());
  prismaMock.processingJob.update.mockResolvedValue(createMockProcessingJob());
};