import { put, del, list } from '@vercel/blob'
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, ListObjectsV2Command, ListObjectsV2CommandOutput } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { promises as fs } from 'fs'
import { config as appConfig } from '@/lib/config'

export interface StorageConfig {
  provider: 'vercel' | 's3'
  s3Config?: {
    region: string
    accessKeyId: string
    secretAccessKey: string
    bucketName: string
    endpoint: string
    publicBaseUrl?: string
    cloudfrontDomain?: string
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

  constructor(cfg?: StorageConfig) {
    this.provider = (cfg?.provider || appConfig.storage.provider || process.env.STORAGE_PROVIDER || 'vercel') as string

    if (this.provider === 's3') {
      const region = cfg?.s3Config?.region ?? appConfig.storage.s3.region ?? process.env.S3_REGION
      const accessKeyId = cfg?.s3Config?.accessKeyId ?? appConfig.storage.s3.accessKeyId ?? process.env.S3_ACCESS_KEY_ID
      const secretAccessKey = cfg?.s3Config?.secretAccessKey ?? appConfig.storage.s3.secretAccessKey ?? process.env.S3_SECRET_ACCESS_KEY
      const bucketName = cfg?.s3Config?.bucketName ?? appConfig.storage.s3.bucketName ?? process.env.S3_BUCKET_NAME
      const endpoint = cfg?.s3Config?.endpoint ?? appConfig.storage.s3.endpoint ?? process.env.S3_ENDPOINT

      if (region && accessKeyId && secretAccessKey && bucketName && endpoint) {
        this.s3Client = new S3Client({
          region,
          endpoint,
          forcePathStyle: true,
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        })
        this.bucketName = bucketName
      }
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
      
      // Build public URL (R2/CDN aware)
      const publicBase = appConfig.storage.s3.publicBaseUrl
      const cloudfront = appConfig.storage.s3.cloudfrontDomain
      let url: string
      if (publicBase) {
        url = `${publicBase.replace(/\/$/, '')}/${key}`
      } else if (cloudfront) {
        url = `https://${cloudfront}/${key}`
      } else if (appConfig.storage.s3.endpoint && appConfig.storage.s3.endpoint.includes('r2.cloudflarestorage.com')) {
        const host = new URL(appConfig.storage.s3.endpoint).host
        url = `https://${host}/${this.bucketName}/${key}`
      } else {
        url = `https://${this.bucketName}.s3.amazonaws.com/${key}`
      }

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
      } else if (this.s3Client && this.bucketName) {
        const prefixes = [`clips/${userId}/`, `thumbnails/${userId}/`]
        let totalSize = 0
        let fileCount = 0

        for (const prefix of prefixes) {
          let ContinuationToken: string | undefined = undefined
          do {
            const resp = await this.s3Client.send(
              new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                ContinuationToken,
                MaxKeys: 1000,
              })
            ) as ListObjectsV2CommandOutput
            const contents = resp.Contents || []
            for (const obj of contents) {
              totalSize += obj.Size ? Number(obj.Size) : 0
              fileCount += 1
            }
            ContinuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined
          } while (ContinuationToken)
        }

        return { totalSize, fileCount }
      }

      return { totalSize: 0, fileCount: 0 }
    } catch (error: unknown) {
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