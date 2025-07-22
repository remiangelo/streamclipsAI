import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TwitchAPIClient } from '@/lib/twitch-api'

describe('TwitchAPIClient', () => {
  let client: TwitchAPIClient

  beforeEach(() => {
    client = new TwitchAPIClient({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
    })
  })

  describe('getUserByUsername', () => {
    it('should fetch user data successfully', async () => {
      const mockUser = {
        id: '12345',
        login: 'testuser',
        display_name: 'TestUser',
        profile_image_url: 'https://example.com/avatar.jpg',
      }

      // Mock the fetch for auth token
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
        })
        // Mock the fetch for user data
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [mockUser] }),
        })

      const user = await client.getUserByUsername('testuser')

      expect(user).toEqual(mockUser)
      expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    it('should handle user not found', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [] }),
        })

      await expect(client.getUserByUsername('nonexistent')).rejects.toThrow('User not found')
    })
  })

  describe('getVODs', () => {
    it('should fetch VODs successfully', async () => {
      const mockVODs = [
        {
          id: 'vod1',
          title: 'Test Stream 1',
          duration: '3h30m',
          created_at: '2024-01-01T00:00:00Z',
          view_count: 1000,
          thumbnail_url: 'https://example.com/thumb1.jpg',
        },
        {
          id: 'vod2',
          title: 'Test Stream 2',
          duration: '2h15m',
          created_at: '2024-01-02T00:00:00Z',
          view_count: 500,
          thumbnail_url: 'https://example.com/thumb2.jpg',
        },
      ]

      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: mockVODs, pagination: {} }),
        })

      const result = await client.getVODs('12345', 'test-token')

      expect(result.data).toEqual(mockVODs)
      expect(result.data).toHaveLength(2)
    })

    it('should handle empty VOD list', async () => {
      global.fetch = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ access_token: 'test-token', expires_in: 3600 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ data: [], pagination: {} }),
        })

      const result = await client.getVODs('12345', 'test-token')

      expect(result.data).toEqual([])
    })
  })

  describe('getChatReplay', () => {
    it('should return mock chat data', async () => {
      const chatData = await client.getChatReplay('vod123')

      expect(chatData).toBeDefined()
      expect(chatData.length).toBeGreaterThan(0)
      expect(chatData[0]).toHaveProperty('timestamp')
      expect(chatData[0]).toHaveProperty('username')
      expect(chatData[0]).toHaveProperty('message')
    })
  })

  describe('parseDuration', () => {
    it('should parse duration correctly', () => {
      expect(client.parseDuration('1h30m45s')).toBe(5445)
      expect(client.parseDuration('2h')).toBe(7200)
      expect(client.parseDuration('45m')).toBe(2700)
      expect(client.parseDuration('30s')).toBe(30)
      expect(client.parseDuration('1h15m30s')).toBe(4530)
    })
  })
})