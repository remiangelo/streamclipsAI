import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '../test-utils'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ClipsPage from '@/app/dashboard/clips/page'
import { mockTRPCResponses } from '../mocks/trpc'
import { createMockClip } from '../mocks/prisma'

// Mock the tRPC client
vi.mock('@/lib/trpc/client', () => {
  const mockTrpc = {
    clip: {
      list: {
        useInfiniteQuery: vi.fn(() => ({
          data: { pages: [], pageParams: [] },
          isLoading: false,
          error: null,
          fetchNextPage: vi.fn(),
          hasNextPage: false,
          isFetchingNextPage: false
        }))
      }
    }
  };
  return { trpc: mockTrpc };
})

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: (date: Date) => '2 hours ago',
}))

// Mock useToast
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}))

import { trpc } from '@/lib/trpc/client'

describe('ClipsPage', () => {
  const mockClipsData = {
    pages: [{ 
      clips: [createMockClip()],
      nextCursor: null 
    }],
    pageParams: [undefined],
  }

  const defaultQueryReturn = {
    data: mockClipsData,
    isLoading: false,
    isError: false,
    error: null,
    fetchNextPage: vi.fn(),
    hasNextPage: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    const { trpc } = require('@/lib/trpc/client')
    trpc.clip.list.useInfiniteQuery.mockReturnValue(defaultQueryReturn)
  })

  describe('Rendering', () => {
    it('should render page header', () => {
      render(<ClipsPage />)
      
      expect(screen.getByText('My Clips')).toBeInTheDocument()
      expect(screen.getByText('View and manage your generated clips')).toBeInTheDocument()
    })

    it('should render search input', () => {
      render(<ClipsPage />)
      
      const searchInput = screen.getByPlaceholderText('Search clips...')
      expect(searchInput).toBeInTheDocument()
    })

    it('should render clips when data is available', async () => {
      render(<ClipsPage />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Clip')).toBeInTheDocument()
        expect(screen.getByText('from Test VOD')).toBeInTheDocument()
      })
    })

    it('should render confidence badges correctly', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipsWithDifferentScores = {
        pages: [{
          clips: [
            { ...mockTRPCResponses.clip.list().clips[0], confidenceScore: 0.9, title: 'High Confidence' },
            { ...mockTRPCResponses.clip.list().clips[0], id: '2', confidenceScore: 0.7, title: 'Medium Confidence' },
            { ...mockTRPCResponses.clip.list().clips[0], id: '3', confidenceScore: 0.4, title: 'Low Confidence' },
          ],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipsWithDifferentScores,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('High')).toBeInTheDocument()
        expect(screen.getByText('Medium')).toBeInTheDocument()
        expect(screen.getByText('Low')).toBeInTheDocument()
      })
    })

    it('should format duration correctly', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithDuration = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            startTime: 0,
            endTime: 125, // 2 minutes 5 seconds
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithDuration,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('2:05')).toBeInTheDocument()
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading state', () => {
      const { trpc } = require('@/lib/trpc/client')
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        isLoading: true,
        data: undefined,
      })

      render(<ClipsPage />)
      
      expect(screen.getByText('Loading clips...')).toBeInTheDocument()
    })

    it('should show empty state when no clips', () => {
      const { trpc } = require('@/lib/trpc/client')
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: { pages: [{ clips: [], nextCursor: null }], pageParams: [] },
      })

      render(<ClipsPage />)
      
      expect(screen.getByText('No clips found')).toBeInTheDocument()
      expect(screen.getByText('Process a VOD to generate clips automatically')).toBeInTheDocument()
    })
  })

  describe('Search Functionality', () => {
    it('should filter clips based on search query', async () => {
      const user = userEvent.setup()
      const { trpc } = require('@/lib/trpc/client')
      const multipleClips = {
        pages: [{
          clips: [
            { ...mockTRPCResponses.clip.list().clips[0], title: 'Epic Gameplay' },
            { ...mockTRPCResponses.clip.list().clips[0], id: '2', title: 'Funny Moment' },
            { ...mockTRPCResponses.clip.list().clips[0], id: '3', title: 'Tutorial Video' },
          ],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: multipleClips,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('Epic Gameplay')).toBeInTheDocument()
        expect(screen.getByText('Funny Moment')).toBeInTheDocument()
        expect(screen.getByText('Tutorial Video')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search clips...')
      await user.type(searchInput, 'funny')

      await waitFor(() => {
        expect(screen.queryByText('Epic Gameplay')).not.toBeInTheDocument()
        expect(screen.getByText('Funny Moment')).toBeInTheDocument()
        expect(screen.queryByText('Tutorial Video')).not.toBeInTheDocument()
      })
    })

    it('should show empty state when search returns no results', async () => {
      const user = userEvent.setup()
      render(<ClipsPage />)

      const searchInput = screen.getByPlaceholderText('Search clips...')
      await user.type(searchInput, 'nonexistent')

      await waitFor(() => {
        expect(screen.getByText('No clips found')).toBeInTheDocument()
      })
    })

    it('should be case insensitive', async () => {
      const user = userEvent.setup()
      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('Test Clip')).toBeInTheDocument()
      })

      const searchInput = screen.getByPlaceholderText('Search clips...')
      await user.type(searchInput, 'TEST')

      await waitFor(() => {
        expect(screen.getByText('Test Clip')).toBeInTheDocument()
      })
    })
  })

  describe('Pagination', () => {
    it('should show load more button when hasNextPage is true', async () => {
      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument()
      })
    })

    it('should not show load more button when hasNextPage is false', async () => {
      const { trpc } = require('@/lib/trpc/client')
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        hasNextPage: false,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.queryByText('Load More')).not.toBeInTheDocument()
      })
    })

    it('should call fetchNextPage when load more is clicked', async () => {
      const fetchNextPage = vi.fn()
      const { trpc } = require('@/lib/trpc/client')
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        fetchNextPage,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('Load More')).toBeInTheDocument()
      })

      const loadMoreButton = screen.getByText('Load More')
      fireEvent.click(loadMoreButton)

      expect(fetchNextPage).toHaveBeenCalledTimes(1)
    })
  })

  describe('Clip Actions', () => {
    it('should render action buttons for each clip', async () => {
      render(<ClipsPage />)

      await waitFor(() => {
        const previewButtons = screen.getAllByText('Preview')
        expect(previewButtons).toHaveLength(2) // One in dropdown, one in card
        
        const downloadButtons = screen.getAllByRole('button', { name: '' })
          .filter(btn => btn.querySelector('[class*="Download"]'))
        expect(downloadButtons.length).toBeGreaterThan(0)
      })
    })

    it('should render dropdown menu with actions', async () => {
      const user = userEvent.setup()
      render(<ClipsPage />)

      await waitFor(() => {
        const moreButtons = screen.getAllByRole('button')
          .filter(btn => btn.querySelector('[class*="MoreVertical"]'))
        expect(moreButtons.length).toBeGreaterThan(0)
      })

      const moreButton = screen.getAllByRole('button')
        .find(btn => btn.querySelector('[class*="MoreVertical"]'))
      
      if (moreButton) {
        await user.click(moreButton)

        await waitFor(() => {
          expect(screen.getByText('Preview')).toBeInTheDocument()
          expect(screen.getByText('Download')).toBeInTheDocument()
          expect(screen.getByText('Share')).toBeInTheDocument()
          expect(screen.getByText('Delete')).toBeInTheDocument()
        })
      }
    })
  })

  describe('Keywords Display', () => {
    it('should display keywords when available', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithKeywords = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            keywords: ['gameplay', 'epic', 'victory', 'clutch'],
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithKeywords,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        expect(screen.getByText('gameplay')).toBeInTheDocument()
        expect(screen.getByText('epic')).toBeInTheDocument()
        expect(screen.getByText('victory')).toBeInTheDocument()
        // Only first 3 keywords should be shown
        expect(screen.queryByText('clutch')).not.toBeInTheDocument()
      })
    })

    it('should not render keywords section when no keywords', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithoutKeywords = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            keywords: [],
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithoutKeywords,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        const badges = screen.queryAllByRole('button')
          .filter(el => el.getAttribute('data-slot') === 'badge')
        // Should only have confidence and duration badges, no keyword badges
        expect(badges.length).toBeLessThan(5)
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      const { trpc } = require('@/lib/trpc/client')
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        isError: true,
        error: new Error('Failed to fetch clips'),
        data: undefined,
      })

      render(<ClipsPage />)

      // The component should handle errors and show empty state
      await waitFor(() => {
        expect(screen.getByText('No clips found')).toBeInTheDocument()
      })
    })
  })

  describe('Image Handling', () => {
    it('should show clip thumbnail when available', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithThumbnail = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            thumbnailUrl: 'https://example.com/clip-thumb.jpg',
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithThumbnail,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        const image = screen.getByAltText('Test Clip')
        expect(image).toHaveAttribute('src', 'https://example.com/clip-thumb.jpg')
      })
    })

    it('should fallback to VOD thumbnail when clip thumbnail not available', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithVodThumbnail = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            thumbnailUrl: null,
            vod: {
              ...mockTRPCResponses.clip.list().clips[0].vod,
              thumbnailUrl: 'https://example.com/vod-thumb.jpg',
            },
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithVodThumbnail,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        const image = screen.getByAltText('Test Clip')
        expect(image).toHaveAttribute('src', 'https://example.com/vod-thumb.jpg')
      })
    })

    it('should show placeholder when no thumbnail available', async () => {
      const { trpc } = require('@/lib/trpc/client')
      const clipWithoutThumbnail = {
        pages: [{
          clips: [{
            ...mockTRPCResponses.clip.list().clips[0],
            thumbnailUrl: null,
            vod: {
              ...mockTRPCResponses.clip.list().clips[0].vod,
              thumbnailUrl: null,
            },
          }],
          nextCursor: null,
        }],
        pageParams: [undefined],
      }
      
      trpc.clip.list.useInfiniteQuery.mockReturnValue({
        ...defaultQueryReturn,
        data: clipWithoutThumbnail,
      })

      render(<ClipsPage />)

      await waitFor(() => {
        // Should show sparkles icon as placeholder
        const placeholder = screen.getByRole('img', { hidden: true })
        expect(placeholder).toBeInTheDocument()
      })
    })
  })
})