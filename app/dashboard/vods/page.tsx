'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Plus, 
  PlayCircle, 
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";

export default function VODsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.vod.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const vods = data?.pages.flatMap(page => page.vods) || [];
  const filteredVods = vods.filter(vod => 
    vod.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
      case 'analyzing_chat':
      case 'generating_clips':
      case 'processing_video':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      failed: "destructive",
      pending: "secondary",
      analyzing_chat: "secondary",
      generating_clips: "secondary",
      processing_video: "secondary",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">My VODs</h2>
          <p className="text-muted-foreground">Manage and process your Twitch VODs</p>
        </div>
        <Button size="lg">
          <Plus className="mr-2 h-4 w-4" />
          Import VOD
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search VODs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error ? (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-2">Failed to load VODs</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="aspect-video bg-muted animate-pulse" />
              <CardHeader className="pb-3">
                <div className="h-5 bg-muted rounded animate-pulse mb-2" />
                <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVods.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground mb-4">No VODs found</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Import Your First VOD
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredVods.map((vod) => (
            <Card key={vod.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                {vod.thumbnailUrl && (
                  <img 
                    src={vod.thumbnailUrl} 
                    alt={vod.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2">
                  <Badge variant="secondary" className="bg-black/50">
                    {Math.floor(vod.duration / 3600)}h {Math.floor((vod.duration % 3600) / 60)}m
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="line-clamp-2 text-lg">{vod.title}</CardTitle>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(vod.createdAt), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(vod.processingStatus)}
                    {getStatusBadge(vod.processingStatus)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {vod.processingStatus !== 'pending' && vod.processingStatus !== 'completed' && (
                  <Progress value={vod.processingProgress} className="mb-3" />
                )}
                <div className="flex gap-2">
                  {vod.processingStatus === 'pending' && (
                    <Button className="flex-1" size="sm">
                      <PlayCircle className="mr-2 h-4 w-4" />
                      Process VOD
                    </Button>
                  )}
                  {vod.processingStatus === 'completed' && (
                    <>
                      <Button className="flex-1" size="sm" variant="outline">
                        View Clips ({vod._count.clips})
                      </Button>
                      <Button size="sm" variant="outline">
                        Reprocess
                      </Button>
                    </>
                  )}
                  {(vod.processingStatus === 'analyzing_chat' || 
                    vod.processingStatus === 'generating_clips' || 
                    vod.processingStatus === 'processing_video') && (
                    <Button className="flex-1" size="sm" disabled>
                      Processing...
                    </Button>
                  )}
                  {vod.processingStatus === 'failed' && (
                    <Button className="flex-1" size="sm" variant="destructive">
                      Retry Processing
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="text-center">
          <Button 
            variant="outline" 
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}