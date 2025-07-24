'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@clerk/nextjs'

export interface ProcessingJob {
  id: string
  type: string
  status: string
  progress?: number
  vodTitle?: string
  error?: string
  updatedAt: string
}

export interface ProcessingClip {
  id: string
  title: string
  status: string
  vodTitle: string
  progress: number
}

export interface ProcessingUpdate {
  type: string
  timestamp: string
  jobs: ProcessingJob[]
  clips: ProcessingClip[]
}

export function useProcessingStream() {
  const { isSignedIn } = useAuth()
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<ProcessingUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    if (!isSignedIn) return

    const eventSource = new EventSource('/api/processing/stream')
    
    eventSource.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'job_update') {
          setLastUpdate(data)
        }
      } catch (err) {
        console.error('Failed to parse SSE data:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      setIsConnected(false)
      setError('Connection lost. Retrying...')
      
      // Reconnect after 5 seconds
      setTimeout(() => {
        eventSource.close()
        connect()
      }, 5000)
    }

    return () => {
      eventSource.close()
      setIsConnected(false)
    }
  }, [isSignedIn])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  return {
    isConnected,
    lastUpdate,
    error,
    jobs: lastUpdate?.jobs || [],
    clips: lastUpdate?.clips || []
  }
}