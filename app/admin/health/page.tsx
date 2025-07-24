'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { api } from '@/lib/trpc/client';
import {
  Database,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminHealthPage() {
  const { data: health, isLoading, refetch } = api.admin.getSystemHealth.useQuery();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'critical':
      case 'unhealthy':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'idle':
        return <Zap className="h-5 w-5 text-gray-500" />;
      default:
        return <Activity className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500';
      case 'warning':
        return 'bg-yellow-500';
      case 'critical':
      case 'unhealthy':
        return 'bg-red-500';
      case 'idle':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">System Health</h1>
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const components = [
    {
      name: 'Database',
      status: health?.database || 'unknown',
      icon: Database,
      description: 'PostgreSQL connection status',
    },
    {
      name: 'Job Queue',
      status: health?.jobQueue || 'unknown',
      icon: Activity,
      description: 'Background job processing status',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">System Health</h1>
          <p className="text-muted-foreground">
            Monitor system components and performance
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Component Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {components.map((component) => (
          <Card key={component.name}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <component.icon className="h-5 w-5" />
                  {component.name}
                </div>
                {getStatusIcon(component.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {component.description}
              </p>
              <Badge className={`${getStatusColor(component.status)} text-white`}>
                {component.status.toUpperCase()}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage Usage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </div>
            {getStatusIcon(health?.storage.status || 'unknown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Used Storage</span>
                <span className="text-sm text-muted-foreground">
                  {health?.storage.usedGB.toFixed(2)} GB / 1000 GB
                </span>
              </div>
              <Progress 
                value={(health?.storage.usedGB || 0) / 10} 
                className="h-2"
              />
            </div>
            
            {health?.storage.status === 'warning' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-950/20 rounded-lg border border-yellow-900/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">
                  Storage usage is approaching capacity limits
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error Rate */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Error Rate (Today)
            </div>
            {getStatusIcon(health?.errorRate.status || 'unknown')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Failed Jobs</span>
                <span className="text-sm text-muted-foreground">
                  {health?.errorRate.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={health?.errorRate.percentage || 0} 
                className="h-2"
              />
            </div>
            
            {health?.errorRate.status === 'warning' && (
              <div className="flex items-center gap-2 p-3 bg-yellow-950/20 rounded-lg border border-yellow-900/50">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-400">
                  Error rate is higher than normal
                </span>
              </div>
            )}
            
            {health?.errorRate.status === 'critical' && (
              <div className="flex items-center gap-2 p-3 bg-red-950/20 rounded-lg border border-red-900/50">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-400">
                  Critical error rate detected - investigate immediately
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {health?.database === 'unhealthy' && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Database Connection Issue</div>
                  <div className="text-muted-foreground">
                    Check database credentials and network connectivity
                  </div>
                </div>
              </div>
            )}
            
            {health?.jobQueue === 'idle' && (
              <div className="flex items-start gap-2">
                <Zap className="h-4 w-4 text-blue-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">Job Queue Idle</div>
                  <div className="text-muted-foreground">
                    No jobs processed recently - ensure job worker is running
                  </div>
                </div>
              </div>
            )}
            
            {(health?.errorRate.percentage || 0) > 10 && (
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div className="text-sm">
                  <div className="font-medium">High Error Rate</div>
                  <div className="text-muted-foreground">
                    Review failed jobs and check for common error patterns
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}