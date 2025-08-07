import { describe, it, expect } from 'vitest'
import { cn } from '@/lib/utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('should combine class names', () => {
      const result = cn('foo', 'bar')
      expect(result).toBe('foo bar')
    })

    it('should handle conditional classes', () => {
      const result = cn('base', true && 'added', false && 'not-added')
      expect(result).toBe('base added')
    })

    it('should handle arrays', () => {
      const result = cn(['foo', 'bar'], 'baz')
      expect(result).toBe('foo bar baz')
    })

    it('should handle objects', () => {
      const result = cn('base', {
        'active': true,
        'disabled': false,
        'highlighted': true,
      })
      expect(result).toBe('base active highlighted')
    })

    it('should merge Tailwind classes correctly', () => {
      const result = cn('px-2 py-1', 'px-4')
      expect(result).toBe('py-1 px-4')
    })

    it('should handle undefined and null values', () => {
      const result = cn('base', undefined, null, 'end')
      expect(result).toBe('base end')
    })

    it('should handle empty strings', () => {
      const result = cn('', 'foo', '', 'bar', '')
      expect(result).toBe('foo bar')
    })
  })
})