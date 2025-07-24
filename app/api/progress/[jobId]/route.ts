import { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs';
import { db } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Store active connections
const connections = new Map<string, ReadableStreamDefaultController>();

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  const { userId } = auth();
  
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { jobId } = params;

  // Verify job belongs to user
  const user = await db.user.findUnique({
    where: { clerkId: userId }
  });

  if (!user) {
    return new Response('User not found', { status: 404 });
  }

  const job = await db.processingJob.findFirst({
    where: {
      id: jobId,
      userId: user.id
    }
  });

  if (!job) {
    return new Response('Job not found', { status: 404 });
  }

  // Create SSE stream
  const stream = new ReadableStream({
    start(controller) {
      // Store connection
      connections.set(jobId, controller);

      // Send initial status
      const data = {
        id: job.id,
        status: job.status,
        progress: job.progress,
        error: job.error,
      };
      
      controller.enqueue(
        `data: ${JSON.stringify(data)}\n\n`
      );

      // Check for updates every 2 seconds
      const interval = setInterval(async () => {
        try {
          const updatedJob = await db.processingJob.findUnique({
            where: { id: jobId }
          });

          if (!updatedJob) {
            clearInterval(interval);
            controller.close();
            connections.delete(jobId);
            return;
          }

          const updateData = {
            id: updatedJob.id,
            status: updatedJob.status,
            progress: updatedJob.progress,
            error: updatedJob.error,
          };

          controller.enqueue(
            `data: ${JSON.stringify(updateData)}\n\n`
          );

          // Close connection if job is complete
          if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
            setTimeout(() => {
              clearInterval(interval);
              controller.close();
              connections.delete(jobId);
            }, 1000);
          }
        } catch (error) {
          console.error('SSE error:', error);
          clearInterval(interval);
          controller.close();
          connections.delete(jobId);
        }
      }, 2000);

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        connections.delete(jobId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// Helper function to send progress updates (called from job processors)
export function sendProgressUpdate(jobId: string, progress: number) {
  const controller = connections.get(jobId);
  if (controller) {
    try {
      controller.enqueue(
        `data: ${JSON.stringify({ id: jobId, progress })}\n\n`
      );
    } catch (error) {
      // Connection might be closed
      connections.delete(jobId);
    }
  }
}