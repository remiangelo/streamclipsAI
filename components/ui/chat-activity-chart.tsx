'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HighlightMoment } from '@/lib/chat-analyzer'

interface ChatActivityChartProps {
  messages: Array<{
    timestamp: number
    username: string
    message: string
  }>
  highlights: HighlightMoment[]
  vodDuration: number // in milliseconds
}

export function ChatActivityChart({ messages, highlights, vodDuration }: ChatActivityChartProps) {
  const chartData = useMemo(() => {
    // Create 60-second buckets for the chart
    const bucketSize = 60000 // 60 seconds in ms
    const buckets = Math.ceil(vodDuration / bucketSize)
    const data: Array<{
      time: number
      messages: number
      isHighlight: boolean
      reason?: string
    }> = []

    // Initialize buckets
    for (let i = 0; i < buckets; i++) {
      data.push({
        time: i * bucketSize,
        messages: 0,
        isHighlight: false
      })
    }

    // Count messages per bucket
    messages.forEach(msg => {
      const bucketIndex = Math.floor(msg.timestamp / bucketSize)
      if (bucketIndex < data.length) {
        data[bucketIndex].messages++
      }
    })

    // Mark highlight buckets
    highlights.forEach(highlight => {
      const startBucket = Math.floor(highlight.timestamp / bucketSize)
      const endBucket = Math.floor(highlight.endTimestamp / bucketSize)
      
      for (let i = startBucket; i <= endBucket && i < data.length; i++) {
        data[i].isHighlight = true
        data[i].reason = highlight.reason
      }
    })

    return data
  }, [messages, highlights, vodDuration])

  const maxMessages = Math.max(...chartData.map(d => d.messages))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat Activity Timeline</CardTitle>
        <CardDescription>
          Message volume over time with AI-detected highlights
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-48 w-full">
          <div className="absolute inset-0 flex items-end">
            {chartData.map((data, index) => {
              const height = maxMessages > 0 ? (data.messages / maxMessages) * 100 : 0
              const isHighlight = data.isHighlight
              
              return (
                <div
                  key={index}
                  className="flex-1 relative group"
                  style={{ height: '100%' }}
                >
                  <div
                    className={`absolute bottom-0 w-full transition-all ${
                      isHighlight
                        ? 'bg-gradient-to-t from-purple-600 to-purple-400'
                        : 'bg-gradient-to-t from-gray-600 to-gray-400'
                    } hover:opacity-80`}
                    style={{ height: `${height}%` }}
                  />
                  {isHighlight && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                  )}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                      <div>{formatTime(data.time)}</div>
                      <div>{data.messages} messages</div>
                      {data.reason && (
                        <div className="text-purple-400">{data.reason}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gray-300" />
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300" />
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(vodDuration)}</span>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-t from-gray-600 to-gray-400 rounded" />
            <span>Normal Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gradient-to-t from-purple-600 to-purple-400 rounded" />
            <span>AI Detected Highlights</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}