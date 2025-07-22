'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Film, 
  Clock, 
  TrendingUp, 
  Plus,
  PlayCircle,
  Sparkles,
  ArrowRight,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.user.stats.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usagePercentage = stats ? (stats.monthlyClips / stats.processingQuota) * 100 : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your content today</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total VODs</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Video className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalVods || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Clips</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Film className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalClips || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +8% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Jobs</CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Clock className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.processingJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Processing now
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Usage</CardTitle>
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20">
              <TrendingUp className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.monthlyClips || 0}<span className="text-lg font-normal text-muted-foreground">/{stats?.processingQuota || 0}</span></div>
            <Progress value={usagePercentage} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/dashboard/vods" className="group">
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all h-full cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Process New VOD</h3>
                  <p className="text-sm text-muted-foreground">
                    Turn your latest stream into viral clips
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/clips" className="group">
              <Card className="border-0 shadow-sm hover:shadow-lg transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                      <PlayCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">View My Clips</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage and download your highlights
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle>Recent Clips</CardTitle>
                <Link href="/dashboard/clips" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentClips && stats.recentClips.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentClips.map((clip) => (
                    <div key={clip.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="relative w-20 h-12 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        {clip.vod.thumbnailUrl ? (
                          <img 
                            src={clip.vod.thumbnailUrl} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{clip.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{clip.vod.title}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0">
                        {Math.round(clip.confidenceScore * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                    <Film className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-2">No clips yet</p>
                  <p className="text-sm text-muted-foreground">Process a VOD to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Status */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-purple-500 to-pink-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/20">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white hover:bg-white/30">
                  {stats?.subscriptionTier || 'FREE'}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg mb-1">Your Plan</h3>
              <p className="text-sm text-white/80 mb-4">
                {stats?.creditsRemaining || 0} credits remaining
              </p>
              {stats?.subscriptionTier === 'free' && (
                <Link href="/dashboard/billing">
                  <Button variant="secondary" className="w-full bg-white text-purple-600 hover:bg-gray-100">
                    Upgrade to Pro
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg. Confidence</span>
                </div>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Avg. Process Time</span>
                </div>
                <span className="text-sm font-medium">2.3 min</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Success Rate</span>
                </div>
                <span className="text-sm font-medium">98.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}