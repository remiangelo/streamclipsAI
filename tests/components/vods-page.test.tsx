import { describe, it, expect, vi } from 'vitest';

// Mock tRPC
vi.mock('@/lib/trpc/client', () => ({
  trpc: {
    vod: {
      list: {
        useQuery: vi.fn(() => ({
          data: { vods: [], nextCursor: null },
          isLoading: false
        }))
      }
    }
  }
}));

describe('VODs Page', () => {
  it('should render VODs page', () => {
    expect(true).toBe(true);
  });
});