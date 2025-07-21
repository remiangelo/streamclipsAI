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
  PlayCircle
} from "lucide-react";
import Link from "next/link";
import { trpc } from "@/lib/trpc/client";

export default function DashboardPage() {
  const { data: stats, isLoading } = trpc.user.stats.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const usagePercentage = stats ? (stats.monthlyClips / stats.processingQuota) * 100 : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
        <p className="text-muted-foreground">Here&apos;s an overview of your StreamClips activity</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total VODs</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalVods || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clips</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalClips || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing Jobs</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.processingJobs || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Usage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.monthlyClips || 0}/{stats?.processingQuota || 0}</div>
            <Progress value={usagePercentage} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/vods">
              <Button className="w-full" size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Process New VOD
              </Button>
            </Link>
            <Link href="/dashboard/clips">
              <Button className="w-full" variant="outline" size="lg">
                <PlayCircle className="mr-2 h-4 w-4" />
                View My Clips
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Clips</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentClips && stats.recentClips.length > 0 ? (
              <div className="space-y-2">
                {stats.recentClips.map((clip) => (
                  <div key={clip.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-16 h-9 bg-muted rounded overflow-hidden">
                        {clip.vod.thumbnailUrl && (
                          <img 
                            src={clip.vod.thumbnailUrl} 
                            alt={clip.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{clip.title}</p>
                        <p className="text-xs text-muted-foreground">{clip.vod.title}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{Math.round(clip.confidenceScore * 100)}%</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No clips yet. Process a VOD to get started!</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
        <CardHeader>
          <CardTitle>Subscription Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-medium capitalize">{stats?.subscriptionTier || 'free'} Plan</p>
              <p className="text-sm text-muted-foreground">
                {stats?.creditsRemaining || 0} credits remaining this month
              </p>
            </div>
            {stats?.subscriptionTier === 'free' && (
              <Link href="/dashboard/billing">
                <Button>Upgrade Plan</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}