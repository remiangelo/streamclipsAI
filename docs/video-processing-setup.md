# Video Processing Setup Guide

This guide explains how to set up and use the video processing pipeline in StreamClips AI.

## Prerequisites

### 1. FFmpeg Installation

The video processing pipeline requires FFmpeg to be installed on your system.

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**Windows:**
Download from [ffmpeg.org](https://ffmpeg.org/download.html) and add to PATH.

### 2. Storage Configuration

Choose one of the following storage providers:

#### Option A: Vercel Blob Storage (Recommended for Vercel deployments)

1. Install Vercel CLI: `npm i -g vercel`
2. Link your project: `vercel link`
3. Create a blob store: `vercel blob create`
4. Copy the token to your `.env.local`:
   ```
   STORAGE_PROVIDER=vercel
   BLOB_READ_WRITE_TOKEN=your-token-here
   ```

#### Option B: AWS S3 (Recommended for production)

1. Create an S3 bucket in AWS Console
2. Create an IAM user with S3 access
3. Configure in `.env.local`:
   ```
   STORAGE_PROVIDER=s3
   AWS_ACCESS_KEY_ID=your-key
   AWS_SECRET_ACCESS_KEY=your-secret
   AWS_REGION=us-east-1
   AWS_S3_BUCKET=your-bucket-name
   ```

4. (Optional) Set up CloudFront CDN:
   ```
   CLOUDFRONT_DOMAIN=your-cloudfront-domain.cloudfront.net
   ```

## Testing the Pipeline

Run the test script to verify your setup:

```bash
npm run test:video
```

This will test:
- FFmpeg installation
- Video extraction
- Thumbnail generation
- Platform-specific conversions
- Storage upload (if configured)

## Architecture Overview

### 1. Job Queue System

The video processing pipeline uses an asynchronous job queue:

```typescript
// Creating a VOD analysis job
await jobQueue.createJob('analyze_vod', vodId, userId);
```

Job types:
- `analyze_vod`: Analyzes chat data and creates clips
- `extract_clip`: Extracts video segments
- `upload_clip`: Uploads to cloud storage

### 2. Video Processing Flow

1. **VOD Analysis**
   - Fetches chat replay data from Twitch
   - Analyzes chat patterns for highlights
   - Creates clip records with timestamps

2. **Clip Extraction**
   - Downloads VOD segment using FFmpeg
   - Processes video (resolution, format, etc.)
   - Saves to temporary storage

3. **Upload & CDN**
   - Uploads processed video to cloud storage
   - Generates thumbnail
   - Returns CDN URLs

### 3. Platform-Specific Formats

The processor supports automatic formatting for:

- **TikTok**: 9:16 aspect ratio, max 60 seconds
- **YouTube Shorts**: 9:16 aspect ratio, max 60 seconds
- **Instagram Reels**: 9:16 aspect ratio, max 90 seconds

## API Usage

### Processing a VOD

```typescript
// In your tRPC router or API endpoint
const job = await jobQueue.createJob(
  'analyze_vod',
  vodId,
  userId
);

// Job will be processed asynchronously
// Check status with:
const status = await jobQueue.getJobStatus(job.id);
```

### Manual Clip Extraction

```typescript
const processor = new VideoProcessor();

const result = await processor.extractClip({
  inputUrl: 'https://example.com/video.m3u8',
  startTime: 120, // 2 minutes
  endTime: 150,   // 2:30
  outputFormat: 'mp4',
  resolution: '1080p'
});

if (result.success) {
  console.log('Clip saved to:', result.outputPath);
}
```

## Production Considerations

### 1. Serverless Limitations

- Vercel Edge Functions have a 4.5MB response limit
- Use background jobs for video processing
- Consider using AWS Lambda for longer processing

### 2. Storage Costs

- Implement storage quotas per user tier
- Use lifecycle policies to delete old clips
- Consider CDN caching strategies

### 3. Twitch API Rate Limits

- Cache VOD metadata
- Implement exponential backoff
- Use webhook subscriptions for real-time updates

### 4. Video Processing Optimization

- Use appropriate presets (`ultrafast` for speed, `slow` for quality)
- Implement progress tracking for user feedback
- Consider GPU acceleration for production

## Troubleshooting

### FFmpeg Not Found

```bash
# Check installation
which ffmpeg

# Add to PATH if needed
export PATH="/usr/local/bin:$PATH"
```

### Storage Upload Failures

1. Check credentials in `.env.local`
2. Verify bucket permissions
3. Check network connectivity

### Memory Issues

- Reduce video resolution
- Process in smaller segments
- Increase Node.js memory limit:
  ```bash
  NODE_OPTIONS="--max-old-space-size=4096" npm run dev
  ```

## Next Steps

1. Set up job queue worker
2. Configure webhook endpoints
3. Implement progress notifications
4. Add video quality presets
5. Set up monitoring and alerts