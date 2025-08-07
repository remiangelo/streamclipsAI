'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HighlightMoment } from '@/lib/chat-analyzer'
import { Clock, MessageSquare, Users, Zap, Smile, PartyPopper, AlertCircle } from 'lucide-react'

interface HighlightPreviewProps {
  highlight: HighlightMoment
  index: number
}

export function HighlightPreview({ highlight, index }: HighlightPreviewProps) {
  const duration = (highlight.endTimestamp - highlight.timestamp) / 1000
  const confidencePercent = Math.round(highlight.confidenceScore * 100)
  
  // Get the dominant activity type
  const getActivityIcon = () => {
    if (highlight.activityPattern === 'spike') return <Zap className="w-4 h-4" />
    if (highlight.activityPattern === 'sustained') return <MessageSquare className="w-4 h-4" />
    return <Clock className="w-4 h-4" />
  }
  
  // Get sentiment icon
  const getSentimentIcon = () => {
    if (highlight.sentimentScore > 0.5) return <Smile className="w-4 h-4 text-green-500" />
    if (highlight.sentimentScore < -0.5) return <AlertCircle className="w-4 h-4 text-red-500" />
    return <PartyPopper className="w-4 h-4 text-purple-500" />
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">
              Highlight #{index + 1}
            </CardTitle>
            <CardDescription>
              {formatTime(highlight.timestamp)} - {formatTime(highlight.endTimestamp)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getActivityIcon()}
            {getSentimentIcon()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Confidence Score</span>
          <div className="flex items-center gap-2">
            <Progress value={confidencePercent} className="w-24" />
            <span className="font-medium">{confidencePercent}%</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <span>{highlight.messageCount} messages</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{highlight.uniqueUsers} users</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{duration}s duration</span>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span>{highlight.peakActivity} msg/s peak</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Reason</div>
          <Badge variant="secondary" className="text-xs">
            {highlight.reason}
          </Badge>
        </div>
        
        {highlight.topEmotes.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Top Emotes</div>
            <div className="flex flex-wrap gap-1">
              {highlight.topEmotes.map((emote, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {emote}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {highlight.keywords.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Keywords</div>
            <div className="flex flex-wrap gap-1">
              {highlight.keywords.map((keyword, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}
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