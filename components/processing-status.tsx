'use client'

import { useProcessingStream } from '@/hooks/use-processing-stream'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Zap,
  Film,
  Upload,
  AlertCircle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

export function ProcessingStatus() {
  const { isConnected, jobs, clips, error } = useProcessingStream()

  const activeJobs = jobs.filter(job => 
    job.status === 'PROCESSING' || job.status === 'PENDING'
  )

  const activeClips = clips.filter(clip => 
    clip.status === 'PROCESSING' || clip.status === 'PENDING'
  )

  if (!isConnected && !error) {
    return null
  }

  if (activeJobs.length === 0 && activeClips.length === 0) {
    return null
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Processing Status</CardTitle>
            <CardDescription>
              Real-time updates on your video processing
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-muted-foreground">Live</span>
              </>
            ) : (
              <>
                <div className="h-2 w-2 bg-red-500 rounded-full" />
                <span className="text-sm text-muted-foreground">Disconnected</span>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-sm text-amber-600">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Active Jobs */}
        {activeJobs.map(job => (
          <div key={job.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {getJobIcon(job.type)}
                <span className="font-medium">{getJobTitle(job.type)}</span>
                {job.vodTitle && (
                  <span className="text-muted-foreground">• {job.vodTitle}</span>
                )}
              </div>
              <Badge variant={getStatusVariant(job.status)}>
                {job.status.toLowerCase()}
              </Badge>
            </div>
            {job.progress !== undefined && (
              <Progress value={job.progress} className="h-2" />
            )}
            {job.error && (
              <p className="text-sm text-red-500">{job.error}</p>
            )}
          </div>
        ))}

        {/* Active Clips */}
        {activeClips.map(clip => (
          <div key={clip.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                <span className="font-medium">{clip.title}</span>
                <span className="text-muted-foreground">• {clip.vodTitle}</span>
              </div>
              <Badge variant={getStatusVariant(clip.status)}>
                {clip.status.toLowerCase()}
              </Badge>
            </div>
            <Progress value={clip.progress} className="h-2" />
          </div>
        ))}

        {/* Recent Completed Jobs */}
        {jobs
          .filter(job => job.status === 'COMPLETED' || job.status === 'FAILED')
          .slice(0, 3)
          .map(job => (
            <div key={job.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {job.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-500" />
                )}
                <span>{getJobTitle(job.type)}</span>
              </div>
              <span className="text-muted-foreground">
                {formatDistanceToNow(new Date(job.updatedAt), { addSuffix: true })}
              </span>
            </div>
          ))}
      </CardContent>
    </Card>
  )
}

function getJobIcon(type: string) {
  switch (type) {
    case 'analyze_vod':
      return <Zap className="w-4 h-4" />
    case 'extract_clip':
      return <Film className="w-4 h-4" />
    case 'upload_clip':
      return <Upload className="w-4 h-4" />
    default:
      return <Clock className="w-4 h-4" />
  }
}

function getJobTitle(type: string) {
  switch (type) {
    case 'analyze_vod':
      return 'Analyzing VOD'
    case 'extract_clip':
      return 'Extracting Clip'
    case 'upload_clip':
      return 'Uploading Clip'
    default:
      return type
  }
}

function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'COMPLETED':
      return 'default'
    case 'PROCESSING':
      return 'secondary'
    case 'FAILED':
      return 'destructive'
    default:
      return 'outline'
  }
}