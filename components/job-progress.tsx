'use client';

import { useJobProgress } from '@/hooks/use-job-progress';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Clock,
  Activity
} from 'lucide-react';
import { ProcessingJobStatus } from '@prisma/client';

interface JobProgressProps {
  jobId: string;
  title?: string;
  onComplete?: () => void;
}

export function JobProgress({ jobId, title = 'Processing', onComplete }: JobProgressProps) {
  const { progress, isConnected } = useJobProgress(jobId);

  const getStatusIcon = (status: ProcessingJobStatus) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'PROCESSING':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'COMPLETED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: ProcessingJobStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'PROCESSING':
        return 'bg-blue-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'FAILED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (!progress) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Connecting...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Call onComplete when job is done
  if (progress.status === 'COMPLETED' && onComplete) {
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {isConnected && progress.status === 'PROCESSING' && (
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Live
              </Badge>
            )}
            {getStatusIcon(progress.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">
              {progress.progress}%
            </span>
          </div>
          <Progress value={progress.progress} className="h-2" />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={`${getStatusColor(progress.status)} text-white`}>
            {progress.status}
          </Badge>
        </div>

        {progress.error && (
          <div className="p-3 bg-red-950/20 rounded-lg border border-red-900/50">
            <p className="text-sm text-red-400">{progress.error}</p>
          </div>
        )}

        {progress.status === 'PROCESSING' && (
          <div className="text-sm text-muted-foreground animate-pulse">
            Processing your video...
          </div>
        )}

        {progress.status === 'COMPLETED' && (
          <div className="text-sm text-green-500">
            ✓ Processing complete!
          </div>
        )}
      </CardContent>
    </Card>
  );
}