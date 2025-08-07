'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/lib/trpc/client';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminJobsPage() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data, isLoading, refetch } = api.admin.getJobs.useQuery({
    page,
    status: statusFilter === 'all' ? undefined : statusFilter as any,
  });

  const retryJob = api.admin.retryJob.useMutation({
    onSuccess: () => {
      toast.success('Job queued for retry');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const statusIcons = {
    PENDING: <Clock className="h-4 w-4 text-yellow-500" />,
    PROCESSING: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    COMPLETED: <CheckCircle className="h-4 w-4 text-green-500" />,
    FAILED: <XCircle className="h-4 w-4 text-red-500" />,
  };

  const statusColors = {
    PENDING: 'bg-yellow-500',
    PROCESSING: 'bg-blue-500',
    COMPLETED: 'bg-green-500',
    FAILED: 'bg-red-500',
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Processing Jobs</h1>
        <p className="text-muted-foreground">
          Monitor and manage video processing jobs
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Jobs Queue</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PROCESSING">Processing</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>VOD</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.jobs.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-xs">
                        {job.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {job.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{job.user.email}</div>
                          {job.user.twitchUsername && (
                            <div className="text-muted-foreground">
                              @{job.user.twitchUsername}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm truncate max-w-[200px]">
                          {job.vod?.title || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {statusIcons[job.status]}
                          <Badge 
                            className={`${statusColors[job.status]} text-white`}
                          >
                            {job.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDuration(job.processingTimeMs)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {job.status === 'FAILED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryJob.mutate({ jobId: job.id })}
                            disabled={retryJob.isLoading}
                          >
                            <RefreshCw className="h-4 w-4" />
                            Retry
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-muted-foreground">
                  Page {page} of {data?.pages || 1} ({data?.total || 0} jobs)
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === (data?.pages || 1)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Job Error Details */}
      {data?.jobs.some(j => j.status === 'FAILED') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              Failed Jobs Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.jobs
                .filter(j => j.status === 'FAILED' && j.error)
                .map(job => (
                  <div key={job.id} className="p-3 bg-red-950/20 rounded-lg border border-red-900/50">
                    <div className="font-mono text-xs text-muted-foreground mb-1">
                      {job.id}
                    </div>
                    <div className="text-sm text-red-400">
                      {job.error}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}