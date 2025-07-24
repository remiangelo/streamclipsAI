import { ProcessingJob, ProcessingJobStatus, ClipStatus } from '@prisma/client'
import { db } from '@/lib/db'
import { ChatAnalyzer } from '@/lib/chat-analyzer'
import { TwitchAPIClient } from '@/lib/twitch-api'
import { VideoProcessor } from '@/lib/video-processor'
import { StorageManager } from '@/lib/storage'

export interface JobResult {
  success: boolean
  error?: string
  data?: any
}

export interface JobProcessor {
  process(job: ProcessingJob): Promise<JobResult>
}

export class JobQueue {
  private processors: Map<string, JobProcessor> = new Map()
  private isProcessing = false
  private processInterval: NodeJS.Timeout | null = null

  constructor() {
    // Register job processors
    this.registerProcessor('analyze_vod', new AnalyzeVODProcessor())
    this.registerProcessor('extract_clip', new ExtractClipProcessor())
    this.registerProcessor('upload_clip', new UploadClipProcessor())
  }

  registerProcessor(type: string, processor: JobProcessor) {
    this.processors.set(type, processor)
  }

  async createJob(
    type: string,
    vodId: string,
    userId: string,
    parameters: any = {},
    priority: number = 0
  ): Promise<ProcessingJob> {
    return await db.processingJob.create({
      data: {
        type,
        vodId,
        userId,
        status: ProcessingJobStatus.PENDING,
        parameters,
        attempts: 0,
        priority
      }
    })
  }

  async start(intervalMs = 5000) {
    if (this.processInterval) return

    this.processInterval = setInterval(() => {
      this.processNextJob()
    }, intervalMs)

    // Process immediately
    this.processNextJob()
  }

  stop() {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
    }
  }

  private async processNextJob() {
    if (this.isProcessing) return

    this.isProcessing = true
    try {
      // Get next pending job
      const job = await db.processingJob.findFirst({
        where: {
          status: ProcessingJobStatus.PENDING,
          attempts: { lt: 3 }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'asc' }
        ]
      })

      if (!job) {
        this.isProcessing = false
        return
      }

      // Update job status
      await db.processingJob.update({
        where: { id: job.id },
        data: {
          status: ProcessingJobStatus.PROCESSING,
          startedAt: new Date(),
          attempts: job.attempts + 1
        }
      })

      // Process the job
      const processor = this.processors.get(job.type)
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.type}`)
      }

      const result = await processor.process(job)

      // Update job with result
      if (result.success) {
        await db.processingJob.update({
          where: { id: job.id },
          data: {
            status: ProcessingJobStatus.COMPLETED,
            completedAt: new Date(),
            result: result.data
          }
        })
      } else {
        const isFinalAttempt = job.attempts >= 3
        await db.processingJob.update({
          where: { id: job.id },
          data: {
            status: isFinalAttempt ? ProcessingJobStatus.FAILED : ProcessingJobStatus.PENDING,
            error: result.error
          }
        })
      }
    } catch (error) {
      console.error('Job processing error:', error)
    } finally {
      this.isProcessing = false
    }
  }

  async getJobStatus(jobId: string): Promise<ProcessingJob | null> {
    return await db.processingJob.findUnique({
      where: { id: jobId }
    })
  }

  async getUserJobs(userId: string, limit = 10): Promise<ProcessingJob[]> {
    return await db.processingJob.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }
}

// Job Processors

class AnalyzeVODProcessor implements JobProcessor {
  async process(job: ProcessingJob): Promise<JobResult> {
    try {
      const vod = await db.vOD.findUnique({
        where: { id: job.vodId },
        include: { user: true }
      })

      if (!vod) {
        return { success: false, error: 'VOD not found' }
      }

      // Initialize Twitch API client
      const twitchClient = new TwitchAPIClient({
        clientId: process.env.TWITCH_CLIENT_ID!,
        clientSecret: process.env.TWITCH_CLIENT_SECRET!
      })

      // Fetch chat data
      const chatMessages = await twitchClient.getChatReplay(vod.twitchVodId)
      
      if (chatMessages.length === 0) {
        return { success: false, error: 'No chat data found for VOD' }
      }

      // Analyze chat for highlights
      const analyzer = new ChatAnalyzer()
      const highlights = analyzer.analyzeChatSpikes(chatMessages)

      // Create clip records for each highlight
      const clips = await Promise.all(
        highlights.map(async (highlight, index) => {
          return await db.clip.create({
            data: {
              vodId: vod.id,
              userId: vod.userId,
              title: `Highlight ${index + 1}: ${highlight.reason}`,
              startTime: Math.floor(highlight.timestamp / 1000),
              endTime: Math.floor(highlight.endTimestamp / 1000),
              confidenceScore: highlight.confidenceScore,
              status: ClipStatus.PENDING,
              metadata: {
                messageCount: highlight.messageCount,
                uniqueUsers: highlight.uniqueUsers,
                topEmotes: highlight.topEmotes,
                keywords: highlight.keywords,
                activityPattern: highlight.activityPattern,
                peakActivity: highlight.peakActivity
              }
            }
          })
        })
      )

      // Update VOD status
      await db.vOD.update({
        where: { id: vod.id },
        data: {
          status: 'ANALYZED',
          analyzedAt: new Date()
        }
      })

      // Get the actual VOD download URL
      const vodDownloadUrl = await twitchClient.getVODDownloadUrl(vod.twitchVodId);
      
      if (!vodDownloadUrl) {
        throw new Error('Failed to get VOD download URL');
      }

      // Create extraction jobs for each clip
      for (const clip of clips) {
        await db.processingJob.create({
          data: {
            type: 'extract_clip',
            vodId: vod.id,
            userId: vod.userId,
            status: ProcessingJobStatus.PENDING,
            parameters: {
              clipId: clip.id,
              vodUrl: vodDownloadUrl,
              startTime: clip.startTime,
              endTime: clip.endTime
            }
          }
        })
      }

      return {
        success: true,
        data: {
          highlightsFound: highlights.length,
          clipsCreated: clips.length
        }
      }
    } catch (error) {
      console.error('VOD analysis error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Analysis failed'
      }
    }
  }
}

class ExtractClipProcessor implements JobProcessor {
  async process(job: ProcessingJob): Promise<JobResult> {
    try {
      const { clipId, vodUrl, startTime, endTime } = job.parameters as {
        clipId: string
        vodUrl: string
        startTime: number
        endTime: number
      }

      const clip = await db.clip.findUnique({
        where: { id: clipId }
      })

      if (!clip) {
        return { success: false, error: 'Clip not found' }
      }

      // Update clip status
      await db.clip.update({
        where: { id: clipId },
        data: { status: ClipStatus.PROCESSING }
      })

      // Process video with progress tracking
      const processor = new VideoProcessor()
      const result = await processor.extractClip({
        inputUrl: vodUrl,
        startTime,
        endTime,
        outputFormat: 'mp4',
        resolution: '1080p',
        onProgress: async (progress) => {
          await db.processingJob.update({
            where: { id: job.id },
            data: { progress: Math.round(progress) }
          })
        }
      })

      if (!result.success) {
        await db.clip.update({
          where: { id: clipId },
          data: { status: ClipStatus.FAILED }
        })
        return { success: false, error: result.error }
      }

      // Create upload job
      await db.processingJob.create({
        data: {
          type: 'upload_clip',
          vodId: job.vodId,
          userId: job.userId,
          status: ProcessingJobStatus.PENDING,
          parameters: {
            clipId,
            localPath: result.outputPath,
            duration: result.duration
          }
        }
      })

      return {
        success: true,
        data: {
          outputPath: result.outputPath,
          duration: result.duration
        }
      }
    } catch (error) {
      console.error('Clip extraction error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }
    }
  }
}

class UploadClipProcessor implements JobProcessor {
  async process(job: ProcessingJob): Promise<JobResult> {
    try {
      const { clipId, localPath, duration } = job.parameters as {
        clipId: string
        localPath: string
        duration: number
      }

      const clip = await db.clip.findUnique({
        where: { id: clipId }
      })

      if (!clip) {
        return { success: false, error: 'Clip not found' }
      }

      // Upload to storage
      const storage = new StorageManager()
      const uploadResult = await storage.uploadClip(localPath, {
        userId: job.userId,
        clipId,
        format: 'mp4'
      })

      if (!uploadResult.success) {
        return { success: false, error: uploadResult.error }
      }

      // Generate thumbnail
      const processor = new VideoProcessor()
      const thumbnailResult = await processor.generateThumbnail(localPath)

      let thumbnailUrl = null
      if (thumbnailResult.success) {
        const thumbUpload = await storage.uploadThumbnail(
          thumbnailResult.outputPath!,
          { userId: job.userId, clipId }
        )
        thumbnailUrl = thumbUpload.url
      }

      // Update clip with URLs
      await db.clip.update({
        where: { id: clipId },
        data: {
          status: ClipStatus.READY,
          videoUrl: uploadResult.url,
          thumbnailUrl,
          duration,
          processedAt: new Date()
        }
      })

      // Clean up local files
      await storage.cleanupLocalFiles([localPath, thumbnailResult.outputPath!])

      return {
        success: true,
        data: {
          videoUrl: uploadResult.url,
          thumbnailUrl,
          duration
        }
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }
}

// Export singleton instance
export const jobQueue = new JobQueue()