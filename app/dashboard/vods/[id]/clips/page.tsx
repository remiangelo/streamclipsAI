'use client'

import { useParams } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { HighlightPreview } from '@/components/ui/highlight-preview'
import { ProcessingStatus } from '@/components/processing-status'
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  Play,
  Clock,
  Sparkles,
  Film,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'
import { formatDuration } from 'date-fns'

export default function VODClipsPage() {
  const params = useParams()
  const vodId = params.id as string

  const { data: vod, isLoading, error } = trpc.vod.get.useQuery({ id: vodId })

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load VOD</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <Link href="/dashboard/vods">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to VODs
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading || !vod) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="grid gap-4 md:grid-cols-2 mt-8">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-5 bg-muted rounded mb-2" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const readyClips = vod.clips.filter(clip => clip.status === 'READY')
  const processingClips = vod.clips.filter(clip => clip.status === 'PROCESSING' || clip.status === 'PENDING')

  return (
    <div className="container mx-auto py-8 space-y-6">
      <ProcessingStatus />

      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/vods">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to VODs
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">{vod.title}</h1>
          <p className="text-muted-foreground mt-2">
            {vod.clips.length} clips generated • {formatDuration({ hours: Math.floor(vod.duration / 3600), minutes: Math.floor((vod.duration % 3600) / 60) })} duration
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Export All
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Download All
          </Button>
        </div>
      </div>

      {processingClips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processing Clips</CardTitle>
            <CardDescription>
              {processingClips.length} clips are being processed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingClips.map((clip, index) => (
              <div key={clip.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{clip.title}</span>
                  <Badge variant="secondary">
                    <Clock className="mr-1 h-3 w-3" />
                    Processing
                  </Badge>
                </div>
                <Progress value={25} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {readyClips.length > 0 ? (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Ready Clips</h2>
          <div className="grid gap-6 md:grid-cols-2">
            {readyClips.map((clip, index) => (
              <Card key={clip.id} className="overflow-hidden">
                <div className="relative aspect-video bg-muted">
                  {clip.thumbnailUrl ? (
                    <img 
                      src={clip.thumbnailUrl} 
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Film className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-black/50">
                      {formatClipDuration(clip.duration || (clip.endTime - clip.startTime))}
                    </Badge>
                    <Button size="icon" variant="secondary" className="bg-black/50 hover:bg-black/70">
                      <Play className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{clip.title}</CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span>Confidence: {Math.round(clip.confidenceScore * 100)}%</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                  </div>
                  {clip.metadata && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Messages</span>
                        <span>{clip.metadata.messageCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Unique Users</span>
                        <span>{clip.metadata.uniqueUsers}</span>
                      </div>
                      {clip.metadata.topEmotes && clip.metadata.topEmotes.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Top Emotes</span>
                          <div className="flex gap-1 mt-1">
                            {clip.metadata.topEmotes.slice(0, 3).map((emote, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {emote}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">No clips ready yet</p>
            <p className="text-sm text-muted-foreground">
              {processingClips.length > 0 
                ? 'Your clips are being processed. This usually takes a few minutes.'
                : 'Analyze this VOD to generate clips.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function formatClipDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}