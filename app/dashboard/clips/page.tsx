'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Share2, 
  MoreVertical,
  Trash2,
  Eye,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";

export default function ClipsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { data, isLoading, fetchNextPage, hasNextPage } = trpc.clip.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const clips = data?.pages.flatMap(page => page.clips) || [];
  const filteredClips = clips.filter(clip => 
    clip.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return <Badge className="bg-green-500">High</Badge>;
    if (score >= 0.6) return <Badge className="bg-yellow-500">Medium</Badge>;
    return <Badge className="bg-gray-500">Low</Badge>;
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">My Clips</h2>
        <p className="text-muted-foreground">View and manage your generated clips</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search clips..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-12">Loading clips...</div>
      ) : filteredClips.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No clips found</p>
            <p className="text-sm text-muted-foreground">Process a VOD to generate clips automatically</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClips.map((clip) => (
            <Card key={clip.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                {(clip.thumbnailUrl || clip.vod.thumbnailUrl) ? (
                  <img 
                    src={(clip.thumbnailUrl || clip.vod.thumbnailUrl) as string} 
                    alt={clip.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute top-2 left-2 right-2 flex justify-between">
                  {getConfidenceBadge(clip.confidenceScore)}
                  <Badge variant="secondary" className="bg-black/50">
                    {formatDuration(clip.startTime, clip.endTime)}
                  </Badge>
                </div>
              </div>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2 text-lg">{clip.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      from {clip.vod.title}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                  <span>{clip.vod.gameCategory || 'No category'}</span>
                  <span>{formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true })}</span>
                </div>
                {clip.keywords && clip.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {clip.keywords.slice(0, 3).map((keyword, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button className="flex-1" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Preview
                  </Button>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4" />
                  </Button>
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
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}