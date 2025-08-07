import { spawn, exec } from 'child_process'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { promisify } from 'util'

const execAsync = promisify(exec)

export interface VideoProcessingOptions {
  inputUrl: string
  startTime: number // in seconds
  endTime: number // in seconds
  outputFormat?: 'mp4' | 'webm' | 'mov'
  resolution?: '1080p' | '720p' | '480p' | 'original'
  fps?: number
  bitrate?: string
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow'
  onProgress?: (progress: number) => void
}

export interface ProcessingResult {
  success: boolean
  outputPath?: string
  duration?: number
  error?: string
}

export class VideoProcessor {
  private tempDir: string

  constructor() {
    this.tempDir = path.join(os.tmpdir(), 'streamclips-ai')
    this.ensureTempDir()
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(this.tempDir, { recursive: true })
    } catch (error) {
      console.error('Failed to create temp directory:', error)
    }
  }

  async extractClip(options: VideoProcessingOptions): Promise<ProcessingResult> {
    const {
      inputUrl,
      startTime,
      endTime,
      outputFormat = 'mp4',
      resolution = '1080p',
      fps = 30,
      bitrate = '5M',
      preset = 'fast'
    } = options

    const duration = endTime - startTime
    const outputPath = path.join(this.tempDir, `clip_${uuidv4()}.${outputFormat}`)

    try {
      // For Twitch VODs, we need to handle authentication
      const isM3U8 = inputUrl.includes('.m3u8')
      const headers = isM3U8 && process.env.TWITCH_CLIENT_ID ? 
        ['-headers', `Client-ID: ${process.env.TWITCH_CLIENT_ID}\r\n`] : []

      // Build FFmpeg command
      const args = [
        ...headers,
        '-ss', startTime.toString(),
        '-i', inputUrl,
        '-t', duration.toString(),
        '-c:v', 'libx264',
        '-preset', preset,
        '-crf', '23',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-b:v', bitrate,
        '-r', fps.toString(),
        '-movflags', '+faststart',
        '-max_muxing_queue_size', '1024'
      ]

      // Add resolution scaling if not original
      if (resolution !== 'original') {
        const scales = {
          '1080p': 'scale=-2:1080',
          '720p': 'scale=-2:720',
          '480p': 'scale=-2:480'
        }
        args.push('-vf', scales[resolution])
      }

      // Add progress monitoring
      args.push('-progress', 'pipe:1')
      args.push('-y', outputPath)

      // Execute FFmpeg with progress tracking
      const progressCallback = (progress: number) => {
        console.log(`Extraction progress: ${progress.toFixed(1)}%`)
        options.onProgress?.(progress)
      }
      
      await this.runFFmpegWithProgress(args, duration, progressCallback)

      // Verify output file exists
      const stats = await fs.stat(outputPath)
      if (!stats.isFile()) {
        throw new Error('Output file not created')
      }

      return {
        success: true,
        outputPath,
        duration
      }
    } catch (error) {
      console.error('Video extraction error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed'
      }
    }
  }

  async generateThumbnail(
    videoPath: string, 
    timestamp?: number
  ): Promise<ProcessingResult> {
    const outputPath = path.join(
      this.tempDir, 
      `thumb_${uuidv4()}.jpg`
    )

    try {
      const args = [
        '-i', videoPath,
        '-ss', (timestamp || 0).toString(),
        '-vframes', '1',
        '-vf', 'scale=-2:720',
        '-q:v', '2',
        '-y', outputPath
      ]

      await this.runFFmpeg(args)

      return {
        success: true,
        outputPath
      }
    } catch (error) {
      console.error('Thumbnail generation error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Thumbnail generation failed'
      }
    }
  }

  async convertForPlatform(
    inputPath: string,
    platform: 'tiktok' | 'youtube_shorts' | 'instagram_reels'
  ): Promise<ProcessingResult> {
    const outputPath = path.join(
      this.tempDir,
      `${platform}_${uuidv4()}.mp4`
    )

    try {
      let args: string[] = []

      switch (platform) {
        case 'tiktok':
          // TikTok: 9:16 aspect ratio, max 60 seconds
          args = [
            '-i', inputPath,
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-t', '60',
            '-y', outputPath
          ]
          break

        case 'youtube_shorts':
          // YouTube Shorts: 9:16 aspect ratio, max 60 seconds
          args = [
            '-i', inputPath,
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-r', '30',
            '-t', '60',
            '-y', outputPath
          ]
          break

        case 'instagram_reels':
          // Instagram Reels: 9:16 aspect ratio, max 90 seconds
          args = [
            '-i', inputPath,
            '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2',
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '23',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-r', '30',
            '-t', '90',
            '-y', outputPath
          ]
          break
      }

      await this.runFFmpeg(args)

      return {
        success: true,
        outputPath
      }
    } catch (error) {
      console.error('Platform conversion error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      }
    }
  }

  async addWatermark(
    videoPath: string,
    watermarkPath: string,
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'
  ): Promise<ProcessingResult> {
    const outputPath = path.join(
      this.tempDir,
      `watermarked_${uuidv4()}.mp4`
    )

    try {
      const positions = {
        'top-left': 'overlay=10:10',
        'top-right': 'overlay=W-w-10:10',
        'bottom-left': 'overlay=10:H-h-10',
        'bottom-right': 'overlay=W-w-10:H-h-10'
      }

      const args = [
        '-i', videoPath,
        '-i', watermarkPath,
        '-filter_complex', `[1:v]scale=150:-1[wm];[0:v][wm]${positions[position]}`,
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-c:a', 'copy',
        '-y', outputPath
      ]

      await this.runFFmpeg(args)

      return {
        success: true,
        outputPath
      }
    } catch (error) {
      console.error('Watermark error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Watermark failed'
      }
    }
  }

  async getVideoInfo(videoPath: string): Promise<{
    duration: number
    width: number
    height: number
    fps: number
    bitrate: number
  } | null> {
    try {
      const args = [
        '-i', videoPath,
        '-v', 'error',
        '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,r_frame_rate,bit_rate,duration',
        '-of', 'json'
      ]

      const output = await this.runFFprobe(args)
      const info = JSON.parse(output)
      
      if (!info.streams || info.streams.length === 0) {
        return null
      }

      const stream = info.streams[0]
      const [fpsNum, fpsDen] = stream.r_frame_rate.split('/')
      
      return {
        duration: parseFloat(stream.duration || '0'),
        width: stream.width,
        height: stream.height,
        fps: Math.round(parseInt(fpsNum) / parseInt(fpsDen)),
        bitrate: parseInt(stream.bit_rate || '0')
      }
    } catch (error) {
      console.error('Get video info error:', error)
      return null
    }
  }

  private runFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args)
      let stderr = ''

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        reject(error)
      })
    })
  }

  private runFFprobe(args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const ffprobe = spawn('ffprobe', args)
      let stdout = ''
      let stderr = ''

      ffprobe.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      ffprobe.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffprobe.on('close', (code) => {
        if (code === 0) {
          resolve(stdout)
        } else {
          reject(new Error(`FFprobe exited with code ${code}: ${stderr}`))
        }
      })

      ffprobe.on('error', (error) => {
        reject(error)
      })
    })
  }

  async cleanup() {
    try {
      const files = await fs.readdir(this.tempDir)
      const now = Date.now()
      const oneHour = 60 * 60 * 1000

      for (const file of files) {
        const filePath = path.join(this.tempDir, file)
        const stats = await fs.stat(filePath)
        
        // Delete files older than 1 hour
        if (now - stats.mtimeMs > oneHour) {
          await fs.unlink(filePath)
        }
      }
    } catch (error) {
      console.error('Cleanup error:', error)
    }
  }

  private runFFmpegWithProgress(
    args: string[],
    totalDuration: number,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args)
      let stderr = ''
      let lastProgress = 0

      ffmpeg.stdout.on('data', (data) => {
        const output = data.toString()
        const lines = output.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('out_time_ms=')) {
            const timeMs = parseInt(line.split('=')[1]) / 1000000
            const progress = (timeMs / totalDuration) * 100
            
            if (progress > lastProgress && onProgress) {
              lastProgress = progress
              onProgress(Math.min(progress, 100))
            }
          }
        }
      })

      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          if (onProgress) onProgress(100)
          resolve()
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${stderr}`))
        }
      })

      ffmpeg.on('error', (error) => {
        reject(error)
      })
    })
  }

  async downloadVODSegment(
    vodUrl: string,
    startTime: number,
    duration: number
  ): Promise<string> {
    const tempPath = path.join(this.tempDir, `vod_${uuidv4()}.ts`)
    
    try {
      const args = [
        '-i', vodUrl,
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-c', 'copy',
        '-y', tempPath
      ]

      if (vodUrl.includes('.m3u8') && process.env.TWITCH_CLIENT_ID) {
        args.unshift('-headers', `Client-ID: ${process.env.TWITCH_CLIENT_ID}\r\n`)
      }

      await this.runFFmpeg(args)
      return tempPath
    } catch (error) {
      console.error('VOD download error:', error)
      throw error
    }
  }

  async validateFFmpegInstallation(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('ffmpeg -version')
      return stdout.includes('ffmpeg version')
    } catch {
      return false
    }
  }
}