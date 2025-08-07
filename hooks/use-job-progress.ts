import { useEffect, useState, useCallback } from 'react';
import { ProcessingJobStatus } from '@prisma/client';

interface JobProgress {
  id: string;
  status: ProcessingJobStatus;
  progress: number;
  error?: string | null;
}

export function useJobProgress(jobId: string | null) {
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (!jobId) return;

    const eventSource = new EventSource(`/api/progress/${jobId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(data);
      } catch (error) {
        console.error('Failed to parse progress data:', error);
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      eventSource.close();
      
      // Retry connection after 5 seconds if job is still processing
      if (progress?.status === 'PROCESSING' || progress?.status === 'PENDING') {
        setTimeout(() => {
          connect();
        }, 5000);
      }
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [jobId, progress?.status]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return { progress, isConnected };
}