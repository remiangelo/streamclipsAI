import { NextResponse } from 'next/server'
import { jobQueue } from '@/lib/job-queue'

// This endpoint should be called by a cron job or on server startup
export async function POST(request: Request) {
  try {
    // Verify the request is authorized (you should add proper auth here)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Start the job queue
    jobQueue.start()

    return NextResponse.json({ 
      success: true, 
      message: 'Job queue started' 
    })
  } catch (error) {
    console.error('Failed to start job queue:', error)
    return NextResponse.json(
      { error: 'Failed to start job queue' },
      { status: 500 }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}