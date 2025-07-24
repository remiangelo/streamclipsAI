import { NextRequest } from 'next/server'
import { currentUser } from '@clerk/nextjs/server'
import { db } from '@/lib/db'

export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const user = await currentUser()
  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const encoder = new TextEncoder()
  const stream = new TransformStream()
  const writer = stream.writable.getWriter()

  // Set up SSE headers
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable Nginx buffering
  })

  // Send initial connection message
  writer.write(encoder.encode('data: {"type":"connected","message":"Connected to processing stream"}\n\n'))

  // Set up polling for job updates
  const pollInterval = setInterval(async () => {
    try {
      // Get user's recent jobs
      const jobs = await db.processingJob.findMany({
        where: {
          userId: user.id,
          OR: [
            { status: 'PROCESSING' },
            { status: 'PENDING' },
            {
              AND: [
                { status: { in: ['COMPLETED', 'FAILED'] } },
                { updatedAt: { gte: new Date(Date.now() - 60000) } } // Updated in last minute
              ]
            }
          ]
        },
        include: {
          vod: {
            select: {
              title: true,
              twitchVodId: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      })

      // Get clip processing status
      const clips = await db.clip.findMany({
        where: {
          userId: user.id,
          status: { in: ['PROCESSING', 'PENDING'] }
        },
        include: {
          vod: {
            select: {
              title: true
            }
          }
        }
      })

      // Send update
      const update = {
        type: 'job_update',
        timestamp: new Date().toISOString(),
        jobs: jobs.map(job => ({
          id: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          vodTitle: job.vod?.title,
          error: job.error,
          updatedAt: job.updatedAt
        })),
        clips: clips.map(clip => ({
          id: clip.id,
          title: clip.title,
          status: clip.status,
          vodTitle: clip.vod.title,
          progress: calculateClipProgress(clip)
        }))
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify(update)}\n\n`))
    } catch (error) {
      console.error('SSE poll error:', error)
    }
  }, 3000) // Poll every 3 seconds

  // Clean up on disconnect
  request.signal.addEventListener('abort', () => {
    clearInterval(pollInterval)
    writer.close()
  })

  return new Response(stream.readable, { headers })
}

function calculateClipProgress(clip: any): number {
  switch (clip.status) {
    case 'PENDING':
      return 0
    case 'ANALYZING':
      return 25
    case 'PROCESSING':
      return 50
    case 'UPLOADING':
      return 75
    case 'READY':
      return 100
    case 'FAILED':
      return 0
    default:
      return 0
  }
}