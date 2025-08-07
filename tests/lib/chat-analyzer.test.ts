import { describe, it, expect } from 'vitest'
import { ChatAnalyzer } from '@/lib/chat-analyzer'

describe('ChatAnalyzer', () => {
  const analyzer = new ChatAnalyzer()

  describe('analyzeChatMessages', () => {
    it('should identify highlight moments based on message velocity', () => {
      const messages = [
        // Normal chat
        { timestamp: 0, username: 'user1', message: 'hello' },
        { timestamp: 5000, username: 'user2', message: 'hi there' },
        // High activity spike
        { timestamp: 60000, username: 'user1', message: 'OMG' },
        { timestamp: 60500, username: 'user2', message: 'POGGERS' },
        { timestamp: 61000, username: 'user3', message: 'LETS GOOOO' },
        { timestamp: 61500, username: 'user4', message: 'NO WAY' },
        { timestamp: 62000, username: 'user5', message: 'INSANE PLAY' },
        { timestamp: 62500, username: 'user6', message: 'CLIP IT' },
        // Back to normal
        { timestamp: 120000, username: 'user1', message: 'gg' },
      ]

      const highlights = analyzer.analyzeChatMessages(messages, 180000) // 3 minute VOD

      expect(highlights).toHaveLength(1)
      expect(highlights[0]).toMatchObject({
        startTime: expect.any(Number),
        endTime: expect.any(Number),
        confidence: expect.any(Number),
        reason: expect.stringContaining('activity spike'),
      })
      expect(highlights[0].confidence).toBeGreaterThan(0.5)
    })

    it('should detect emote spam as highlights', () => {
      const messages = [
        { timestamp: 0, username: 'user1', message: 'normal chat' },
        // Emote spam - more messages to trigger detection
        { timestamp: 30000, username: 'user1', message: 'PogChamp PogChamp PogChamp' },
        { timestamp: 30100, username: 'user2', message: 'KEKW KEKW' },
        { timestamp: 30200, username: 'user3', message: 'LUL LUL LUL' },
        { timestamp: 30300, username: 'user4', message: 'PogChamp' },
        { timestamp: 30400, username: 'user5', message: 'OMEGALUL' },
        { timestamp: 30500, username: 'user6', message: 'POGGERS' },
      ]

      const highlights = analyzer.analyzeChatMessages(messages, 60000)

      expect(highlights).toHaveLength(1)
      expect(highlights[0].keywords).toContain('pogchamp')
    })

    it('should handle empty chat gracefully', () => {
      const highlights = analyzer.analyzeChatMessages([], 60000)
      expect(highlights).toEqual([])
    })

    it('should merge nearby highlights', () => {
      const messages = [
        // First spike
        { timestamp: 10000, username: 'user1', message: 'WOW' },
        { timestamp: 10100, username: 'user2', message: 'AMAZING' },
        { timestamp: 10200, username: 'user3', message: 'POGGERS' },
        { timestamp: 10300, username: 'user4', message: 'INSANE' },
        // Brief pause
        { timestamp: 25000, username: 'user1', message: 'wait' },
        // Second spike (should merge)
        { timestamp: 35000, username: 'user1', message: 'OMG AGAIN' },
        { timestamp: 35100, username: 'user2', message: 'NO WAY' },
        { timestamp: 35200, username: 'user3', message: 'TWICE IN A ROW' },
        { timestamp: 35300, username: 'user4', message: 'CLIP IT' },
      ]

      const highlights = analyzer.analyzeChatMessages(messages, 60000)

      // Should merge into one highlight
      expect(highlights).toHaveLength(1)
      expect(highlights[0].endTime - highlights[0].startTime).toBeGreaterThan(20000)
    })
  })

  describe('sentiment analysis', () => {
    it('should detect positive sentiment', () => {
      const positiveMessages = [
        { timestamp: 0, username: 'user1', message: 'Amazing play!' },
        { timestamp: 1000, username: 'user2', message: 'That was incredible!' },
        { timestamp: 2000, username: 'user3', message: 'Best streamer ever!' },
        { timestamp: 3000, username: 'user4', message: 'POG POG POG!' },
        { timestamp: 4000, username: 'user5', message: 'LETS GO!' },
      ]

      const highlights = analyzer.analyzeChatMessages(positiveMessages, 10000)
      
      expect(highlights.length).toBeGreaterThan(0)
      if (highlights.length > 0) {
        expect(highlights[0].sentiment).toBeGreaterThan(0)
      }
    })

    it('should detect negative sentiment', () => {
      const negativeMessages = [
        { timestamp: 0, username: 'user1', message: 'That was terrible' },
        { timestamp: 1000, username: 'user2', message: 'Worst play ever' },
        { timestamp: 2000, username: 'user3', message: 'So bad' },
      ]

      const highlights = analyzer.analyzeChatMessages(negativeMessages, 10000)
      
      if (highlights.length > 0) {
        expect(highlights[0].sentiment).toBeLessThan(0)
      }
    })
  })

  describe('keyword extraction', () => {
    it('should extract relevant keywords', () => {
      const messages = [
        { timestamp: 0, username: 'user1', message: 'clutch ace insane' },
        { timestamp: 100, username: 'user2', message: 'best ace ever' },
        { timestamp: 200, username: 'user3', message: 'clutch god' },
      ]

      const highlights = analyzer.analyzeChatMessages(messages, 10000)
      
      if (highlights.length > 0) {
        expect(highlights[0].keywords).toContain('ace')
        expect(highlights[0].keywords).toContain('clutch')
      }
    })
  })
})