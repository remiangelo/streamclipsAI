import { vi } from 'vitest';
import { 
  createMockUser, 
  createMockVOD, 
  createMockClip, 
  createMockProcessingJob 
} from './prisma';

// Mock tRPC responses
export const mockTRPCResponses = {
  user: {
    me: () => createMockUser(),
    stats: () => ({
      totalClips: 45,
      totalVods: 10,
      monthlyClips: 8,
      processingJobs: 2,
      recentClips: [createMockClip()],
      creditsRemaining: 100,
      processingQuota: 20,
      subscriptionTier: 'starter',
    }),
  },
  vod: {
    list: () => ({
      vods: [createMockVOD()],
      nextCursor: null,
    }),
    create: (input: any) => createMockVOD(input),
    get: () => createMockVOD(),
  },
  clip: {
    list: () => ({
      clips: [createMockClip()],
      nextCursor: null,
    }),
    create: (input: any) => createMockClip(input),
    delete: () => ({ success: true }),
  },
  processing: {
    startVodProcessing: () => ({ jobId: 'job_123' }),
    getJobStatus: () => createMockProcessingJob(),
    listActiveJobs: () => [createMockProcessingJob()],
  },
};