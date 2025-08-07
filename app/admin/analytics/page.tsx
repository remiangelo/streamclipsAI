'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/trpc/client';
import { BarChart3, TrendingUp, Users, Clock, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = api.admin.getAnalytics.useQuery({ days });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <div className="grid gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            Platform usage and performance metrics
          </p>
        </div>
        <Select value={days.toString()} onValueChange={(v) => setDays(parseInt(v))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
            <SelectItem value="90">90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Daily Activity Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Daily Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.dailyStats.map((stat) => (
              <div key={stat.date.toString()} className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground w-24">
                  {new Date(stat.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Clips</div>
                    <div className="h-6 bg-purple-500/20 rounded-md relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-purple-500 rounded-md"
                        style={{ width: `${Math.min((stat.clips / 50) * 100, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {stat.clips}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">New Users</div>
                    <div className="h-6 bg-blue-500/20 rounded-md relative overflow-hidden">
                      <div 
                        className="absolute inset-y-0 left-0 bg-blue-500 rounded-md"
                        style={{ width: `${Math.min((stat.users / 10) * 100, 100)}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                        {stat.users}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Users */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Users by Clips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.topUsers.map((user, index) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{user.email}</div>
                    {user.twitchUsername && (
                      <div className="text-sm text-muted-foreground">
                        @{user.twitchUsername}
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant="secondary">
                  {user._count.clips} clips
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Processing Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Processing Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-green-500">
                {formatTime(data?.processingStats.avgTimeMs || 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Average Time
              </div>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-blue-500">
                {formatTime(data?.processingStats.minTimeMs || 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Fastest
              </div>
            </div>
            <div className="text-center p-4 bg-gray-900 rounded-lg">
              <div className="text-2xl font-bold text-orange-500">
                {formatTime(data?.processingStats.maxTimeMs || 0)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Slowest
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Growth Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Growth Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-4">Clips Created</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-medium">
                    {data?.dailyStats.reduce((sum, stat) => sum + stat.clips, 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-medium">
                    {Math.round((data?.dailyStats.reduce((sum, stat) => sum + stat.clips, 0) || 0) / days)}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-4">User Growth</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">New Users</span>
                  <span className="font-medium">
                    {data?.dailyStats.reduce((sum, stat) => sum + stat.users, 0) || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Daily Average</span>
                  <span className="font-medium">
                    {Math.round((data?.dailyStats.reduce((sum, stat) => sum + stat.users, 0) || 0) / days)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}