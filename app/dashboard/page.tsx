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
  BarChart3,
  Zap,
  Activity
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";
import { ProcessingStatus } from "@/components/processing-status";

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.user.stats.useQuery();

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-gray-800 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl"></div>
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
      <div className="mb-8 animate-fade-down">
        <h1 className="text-4xl font-bold tracking-tight mb-2 text-gradient">Welcome back!</h1>
        <p className="text-gray-400">Here's what's happening with your content today</p>
      </div>

      {/* Processing Status */}
      <ProcessingStatus />

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 animate-stagger">
        <Card className="glass-dark border-0 hover:scale-105 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total VODs</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 backdrop-blur-xl">
              <Video className="h-4 w-4 text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalVods || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-0 hover:scale-105 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Clips</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl">
              <Film className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalClips || 0}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              +8% from last month
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-0 hover:scale-105 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Jobs</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-600/20 to-emerald-600/20 backdrop-blur-xl">
              <Clock className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.processingJobs || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Processing now
            </p>
          </CardContent>
        </Card>
        
        <Card className="glass-dark border-0 hover:scale-105 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Monthly Usage</CardTitle>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-600/20 to-red-600/20 backdrop-blur-xl">
              <Activity className="h-4 w-4 text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {stats?.monthlyClips || 0}
              <span className="text-lg font-normal text-gray-500">/{stats?.processingQuota || 0}</span>
            </div>
            <Progress value={usagePercentage} className="mt-2 h-1.5 bg-gray-800" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Cards */}
          <div className="grid gap-4 md:grid-cols-2 animate-fade-up">
            <Link href="/dashboard/vods" className="group">
              <Card className="glass-purple border-0 hover:scale-[1.02] transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600 shadow-lg shadow-purple-500/25">
                      <Plus className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">Process New VOD</h3>
                  <p className="text-sm text-gray-400">
                    Turn your latest stream into viral clips
                  </p>
                </CardContent>
              </Card>
            </Link>
            
            <Link href="/dashboard/clips" className="group">
              <Card className="glass-dark border-0 hover:scale-[1.02] transition-all h-full cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/20 to-cyan-600/20 backdrop-blur-xl">
                      <PlayCircle className="h-6 w-6 text-blue-400" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1">View My Clips</h3>
                  <p className="text-sm text-gray-400">
                    Manage and download your highlights
                  </p>
                </CardContent>
              </Card>
            </Link>
          </div>

          {/* Recent Activity */}
          <Card className="glass-dark border-0 animate-fade-up" style={{animationDelay: '100ms'}}>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Recent Clips</CardTitle>
                <Link href="/dashboard/clips" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View all →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentClips && stats.recentClips.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentClips.map((clip) => (
                    <div key={clip.id} className="flex items-center gap-4 p-3 rounded-xl glass hover:bg-white/5 transition-all group">
                      <div className="relative w-20 h-12 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                        {clip.vod.thumbnailUrl ? (
                          <img 
                            src={clip.vod.thumbnailUrl} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Sparkles className="h-6 w-6 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate group-hover:text-purple-400 transition-colors">{clip.title}</p>
                        <p className="text-xs text-gray-500 truncate">{clip.vod.title}</p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 bg-purple-500/20 text-purple-400 border-purple-500/30">
                        {Math.round(clip.confidenceScore * 100)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-4 rounded-full glass-dark w-fit mx-auto mb-4">
                    <Film className="h-8 w-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400 mb-2">No clips yet</p>
                  <p className="text-sm text-gray-500">Process a VOD to get started!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Subscription Status */}
          <Card className="border-0 relative overflow-hidden animate-fade-up" style={{animationDelay: '200ms'}}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600" />
            <div className="relative glass-dark backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-xl">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                    {stats?.subscriptionTier || 'FREE'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg mb-1 text-white">Your Plan</h3>
                <p className="text-sm text-white/80 mb-4">
                  {stats?.creditsRemaining || 0} credits remaining
                </p>
                {stats?.subscriptionTier === 'free' && (
                  <Link href="/dashboard/subscription">
                    <Button variant="secondary" className="w-full bg-white text-purple-600 hover:bg-gray-100">
                      Upgrade to Pro
                    </Button>
                  </Link>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="glass-dark border-0 animate-fade-up" style={{animationDelay: '300ms'}}>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg glass hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <BarChart3 className="h-4 w-4 text-purple-400" />
                  </div>
                  <span className="text-sm">Avg. Confidence</span>
                </div>
                <span className="text-sm font-medium text-purple-400">87%</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Clock className="h-4 w-4 text-blue-400" />
                  </div>
                  <span className="text-sm">Avg. Process Time</span>
                </div>
                <span className="text-sm font-medium text-blue-400">2.3 min</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg glass hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Zap className="h-4 w-4 text-green-400" />
                  </div>
                  <span className="text-sm">Success Rate</span>
                </div>
                <span className="text-sm font-medium text-green-400">98.5%</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}