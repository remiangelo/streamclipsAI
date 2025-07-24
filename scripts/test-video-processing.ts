import 'dotenv/config';
import { VideoProcessor } from '@/lib/video-processor';
import { TwitchAPIClient } from '@/lib/twitch-api';
import { StorageManager } from '@/lib/storage';
import path from 'path';

async function testVideoProcessing() {
  console.log('🎬 Testing Video Processing Pipeline...\n');

  // 1. Test FFmpeg Installation
  console.log('1. Checking FFmpeg installation...');
  const processor = new VideoProcessor();
  const ffmpegInstalled = await processor.validateFFmpegInstallation();
  
  if (!ffmpegInstalled) {
    console.error('❌ FFmpeg is not installed. Please install FFmpeg first.');
    process.exit(1);
  }
  console.log('✅ FFmpeg is installed\n');

  // 2. Test with a sample video (using a public test video)
  console.log('2. Testing video extraction with sample video...');
  const testVideoUrl = 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4';
  
  try {
    const result = await processor.extractClip({
      inputUrl: testVideoUrl,
      startTime: 2,
      endTime: 7,
      outputFormat: 'mp4',
      resolution: '720p'
    });

    if (result.success) {
      console.log('✅ Video extraction successful');
      console.log(`   Output: ${result.outputPath}`);
      console.log(`   Duration: ${result.duration}s\n`);

      // 3. Test thumbnail generation
      console.log('3. Testing thumbnail generation...');
      const thumbnailResult = await processor.generateThumbnail(result.outputPath!, 2);
      
      if (thumbnailResult.success) {
        console.log('✅ Thumbnail generated');
        console.log(`   Output: ${thumbnailResult.outputPath}\n`);
      } else {
        console.log('❌ Thumbnail generation failed:', thumbnailResult.error);
      }

      // 4. Test platform conversion
      console.log('4. Testing platform-specific conversion (TikTok)...');
      const tiktokResult = await processor.convertForPlatform(result.outputPath!, 'tiktok');
      
      if (tiktokResult.success) {
        console.log('✅ TikTok conversion successful');
        console.log(`   Output: ${tiktokResult.outputPath}\n`);
      } else {
        console.log('❌ TikTok conversion failed:', tiktokResult.error);
      }

      // 5. Test video info extraction
      console.log('5. Testing video info extraction...');
      const videoInfo = await processor.getVideoInfo(result.outputPath!);
      
      if (videoInfo) {
        console.log('✅ Video info extracted:');
        console.log(`   Resolution: ${videoInfo.width}x${videoInfo.height}`);
        console.log(`   FPS: ${videoInfo.fps}`);
        console.log(`   Duration: ${videoInfo.duration}s`);
        console.log(`   Bitrate: ${videoInfo.bitrate} bps\n`);
      } else {
        console.log('❌ Failed to extract video info\n');
      }

      // Clean up
      await processor.cleanup();
      console.log('✅ Cleanup completed\n');

    } else {
      console.log('❌ Video extraction failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  // 6. Test Twitch API (if credentials are available)
  if (process.env.TWITCH_CLIENT_ID && process.env.TWITCH_CLIENT_SECRET) {
    console.log('6. Testing Twitch API connection...');
    const twitchClient = new TwitchAPIClient({
      clientId: process.env.TWITCH_CLIENT_ID,
      clientSecret: process.env.TWITCH_CLIENT_SECRET
    });

    try {
      // Test with a known VOD ID (replace with a real one for testing)
      const testVodId = '123456789'; // Replace with actual VOD ID
      const vodUrl = await twitchClient.getVODDownloadUrl(testVodId);
      
      if (vodUrl) {
        console.log('✅ Got VOD download URL');
        console.log(`   URL: ${vodUrl.substring(0, 100)}...\n`);
      } else {
        console.log('⚠️  Could not get VOD URL (VOD might not exist)\n');
      }
    } catch (error) {
      console.log('⚠️  Twitch API test skipped:', error);
    }
  } else {
    console.log('⚠️  Skipping Twitch API test (no credentials)\n');
  }

  // 7. Test Storage Manager
  console.log('7. Testing Storage Manager...');
  const storage = new StorageManager();
  console.log(`   Storage provider: ${process.env.STORAGE_PROVIDER || 'vercel'}`);
  console.log('✅ Storage manager initialized\n');

  console.log('🎉 Video processing pipeline test complete!');
}

// Run the test
testVideoProcessing().catch(console.error);