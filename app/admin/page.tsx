'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { trpc } from '@/lib/trpc/client';
import {
  Users,
  DollarSign,
  Briefcase,
  Film,
  TrendingUp,
  AlertCircle,
  Activity,
  UserPlus
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type SubscriptionTierStat = { subscriptionTier: string; _count: number };

export default function AdminOverviewPage() {
  const { data: overview, isLoading } = trpc.admin.getOverview.useQuery();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Users',
      value: overview?.users.total || 0,
      change: `+${overview?.users.newThisMonth || 0} this month`,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Active Users',
      value: overview?.users.activeThisWeek || 0,
      change: 'Last 7 days',
      icon: Activity,
      color: 'text-green-500',
    },
    {
      title: 'Monthly Revenue',
      value: `$${overview?.revenue.mrr || 0}`,
      change: `+${overview?.revenue.growth || 0}%`,
      icon: DollarSign,
      color: 'text-purple-500',
    },
    {
      title: 'Total Clips',
      value: overview?.clips.total || 0,
      change: `+${overview?.clips.thisMonth || 0} this month`,
      icon: Film,
      color: 'text-orange-500',
    },
  ];

  const subscriptionData: SubscriptionTierStat[] = (overview?.subscriptions ?? []) as SubscriptionTierStat[];
  const totalSubscribers = subscriptionData.reduce((sum, tier) => sum + tier._count, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Overview</h1>
        <p className="text-muted-foreground">
          Monitor your platform&apos;s performance and health
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {subscriptionData.map((tier) => {
                const percentage = totalSubscribers > 0 
                  ? (tier._count / totalSubscribers) * 100 
                  : 0;
                
                return (
                  <div key={tier.subscriptionTier}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium capitalize">
                        {tier.subscriptionTier}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {tier._count} users
                      </span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Processing Status */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Total Jobs</span>
                </div>
                <span className="text-2xl font-bold">
                  {overview?.processing.totalJobs || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">Pending</span>
                </div>
                <Badge variant="secondary">
                  {overview?.processing.pendingJobs || 0}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Failed (7d)</span>
                </div>
                <Badge variant="destructive">
                  {overview?.processing.failedJobs || 0}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-800"
              onClick={() => window.location.href = '/admin/users'}
            >
              <UserPlus className="h-3 w-3 mr-1" />
              Manage Users
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-800"
              onClick={() => window.location.href = '/admin/jobs'}
            >
              <Briefcase className="h-3 w-3 mr-1" />
              View Jobs
            </Badge>
            <Badge 
              variant="outline" 
              className="cursor-pointer hover:bg-gray-800"
              onClick={() => window.location.href = '/admin/analytics'}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Analytics
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}