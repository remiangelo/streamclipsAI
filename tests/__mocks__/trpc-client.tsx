import { vi } from 'vitest';

// Mock tRPC client
export const trpc = {
  vod: {
    list: {
      useQuery: vi.fn(() => ({
        data: {
          vods: [],
          nextCursor: undefined
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      })),
      useInfiniteQuery: vi.fn(() => ({
        data: {
          pages: [{ vods: [], nextCursor: undefined }]
        },
        isLoading: false,
        error: null,
        fetchNextPage: vi.fn(),
        hasNextPage: false,
        isFetchingNextPage: false
      }))
    },
    get: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    },
    analyze: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    },
    reprocess: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    }
  },
  clip: {
    list: {
      useQuery: vi.fn(() => ({
        data: {
          clips: [],
          totalCount: 0
        },
        isLoading: false,
        error: null,
        refetch: vi.fn()
      }))
    },
    get: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    },
    delete: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    },
    export: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    }
  },
  user: {
    stats: {
      useQuery: vi.fn(() => ({
        data: {
          totalVods: 0,
          totalClips: 0,
          monthlyClips: 0,
          processingQuota: 20,
          subscriptionTier: 'free',
          creditsRemaining: 5
        },
        isLoading: false,
        error: null
      }))
    }
  },
  processing: {
    status: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    }
  },
  subscription: {
    getStatus: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    },
    getPlans: {
      useQuery: vi.fn(() => ({
        data: [],
        isLoading: false,
        error: null
      }))
    },
    getPortalUrl: {
      useQuery: vi.fn(() => ({
        data: null,
        isLoading: false,
        error: null
      }))
    },
    createCheckout: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    },
    cancel: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    },
    resume: {
      useMutation: vi.fn(() => ({
        mutate: vi.fn(),
        isLoading: false
      }))
    }
  }
};

// Helper to create custom mock implementations
export const createMockTRPC = (overrides = {}) => {
  return {
    ...trpc,
    ...overrides
  };
};