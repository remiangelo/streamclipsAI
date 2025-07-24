import { put, del, list } from '@vercel/blob'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { promises as fs } from 'fs'
import path from 'path'

export interface StorageConfig {
  provider: 'vercel' | 's3'
  s3Config?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
  }
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  error?: string
}

export interface UploadOptions {
  userId: string
  clipId: string
  format: string
}

export class StorageManager {
  private provider: string
  private s3Client?: S3Client
  private bucketName?: string

  constructor(config?: StorageConfig) {
    this.provider = config?.provider || process.env.STORAGE_PROVIDER || 'vercel'
    
    if (this.provider === 's3' && config?.s3Config) {
      this.s3Client = new S3Client({
        region: config.s3Config.region,
        credentials: {
          accessKeyId: config.s3Config.accessKeyId,
          secretAccessKey: config.s3Config.secretAccessKey
        }
      })
      this.bucketName = config.s3Config.bucketName
    }
  }

  async uploadClip(filePath: string, options: UploadOptions): Promise<UploadResult> {
    try {
      const fileBuffer = await fs.readFile(filePath)
      const fileName = `clips/${options.userId}/${options.clipId}.${options.format}`
      
      if (this.provider === 'vercel') {
        return await this.uploadToVercelBlob(fileBuffer, fileName)
      } else if (this.provider === 's3') {
        return await this.uploadToS3(fileBuffer, fileName, `video/${options.format}`)
      }
      
      return { success: false, error: 'Invalid storage provider' }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  async uploadThumbnail(filePath: string, options: Omit<UploadOptions, 'format'>): Promise<UploadResult> {
    try {
      const fileBuffer = await fs.readFile(filePath)
      const fileName = `thumbnails/${options.userId}/${options.clipId}.jpg`
      
      if (this.provider === 'vercel') {
        return await this.uploadToVercelBlob(fileBuffer, fileName)
      } else if (this.provider === 's3') {
        return await this.uploadToS3(fileBuffer, fileName, 'image/jpeg')
      }
      
      return { success: false, error: 'Invalid storage provider' }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      }
    }
  }

  private async uploadToVercelBlob(buffer: Buffer, fileName: string): Promise<UploadResult> {
    try {
      const blob = await put(fileName, buffer, {
        access: 'public',
        addRandomSuffix: false
      })
      
      return {
        success: true,
        url: blob.url,
        key: fileName
      }
    } catch (error) {
      console.error('Vercel Blob upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Vercel Blob upload failed'
      }
    }
  }

  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<UploadResult> {
    if (!this.s3Client || !this.bucketName) {
      return { success: false, error: 'S3 not configured' }
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'max-age=31536000' // 1 year cache
      })
      
      await this.s3Client.send(command)
      
      // Generate CloudFront URL if configured
      const url = process.env.CLOUDFRONT_DOMAIN
        ? `https://${process.env.CLOUDFRONT_DOMAIN}/${key}`
        : `https://${this.bucketName}.s3.amazonaws.com/${key}`
      
      return {
        success: true,
        url,
        key
      }
    } catch (error) {
      console.error('S3 upload error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'S3 upload failed'
      }
    }
  }

  async generateSignedUrl(key: string, expiresIn = 3600): Promise<string | null> {
    if (this.provider !== 's3' || !this.s3Client || !this.bucketName) {
      return null
    }

    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      })
      
      return await getSignedUrl(this.s3Client, command, { expiresIn })
    } catch (error) {
      console.error('Generate signed URL error:', error)
      return null
    }
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      if (this.provider === 'vercel') {
        await del(key)
        return true
      } else if (this.provider === 's3' && this.s3Client && this.bucketName) {
        const command = new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key
        })
        await this.s3Client.send(command)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Delete file error:', error)
      return false
    }
  }

  async cleanupLocalFiles(filePaths: string[]): Promise<void> {
    for (const filePath of filePaths) {
      try {
        if (filePath && await this.fileExists(filePath)) {
          await fs.unlink(filePath)
        }
      } catch (error) {
        console.error(`Failed to delete local file ${filePath}:`, error)
      }
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }

  async getUserStorageUsage(userId: string): Promise<{
    totalSize: number
    fileCount: number
  }> {
    try {
      if (this.provider === 'vercel') {
        const { blobs } = await list({
          prefix: `clips/${userId}/`,
          limit: 1000
        })
        
        const thumbnails = await list({
          prefix: `thumbnails/${userId}/`,
          limit: 1000
        })
        
        const allBlobs = [...blobs, ...thumbnails.blobs]
        
        return {
          totalSize: allBlobs.reduce((sum, blob) => sum + blob.size, 0),
          fileCount: allBlobs.length
        }
      }
      
      // For S3, you'd implement ListObjectsV2 command
      return { totalSize: 0, fileCount: 0 }
    } catch (error) {
      console.error('Get storage usage error:', error)
      return { totalSize: 0, fileCount: 0 }
    }
  }

  async enforceStorageLimits(userId: string, maxStorageBytes: number): Promise<{
    withinLimit: boolean
    currentUsage: number
    limit: number
  }> {
    const usage = await this.getUserStorageUsage(userId)
    
    return {
      withinLimit: usage.totalSize <= maxStorageBytes,
      currentUsage: usage.totalSize,
      limit: maxStorageBytes
    }
  }
}

// Storage limits by subscription tier (in GB)
export const STORAGE_LIMITS = {
  FREE: 5 * 1024 * 1024 * 1024, // 5 GB
  STARTER: 50 * 1024 * 1024 * 1024, // 50 GB
  PRO: 200 * 1024 * 1024 * 1024, // 200 GB
  STUDIO: 1024 * 1024 * 1024 * 1024 // 1 TB
}

export const storage = new StorageManager()