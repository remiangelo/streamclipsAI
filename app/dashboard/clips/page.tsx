'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Filter,
  Download,
  Share2,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Film,
  TrendingUp,
  Clock,
  Sparkles,
  AlertCircle,
  Zap,
  MessageSquare
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { trpc } from '@/lib/trpc/client';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';

export default function ClipsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'processing' | 'failed'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'confidence'>('recent');
  const { toast } = useToast();

  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.clip.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const clips = data?.pages.flatMap(page => page.clips) || [];
  const filteredClips = clips.filter(clip => 
    clip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    clip.vod.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceBadge = (score: number) => {
    if (score >= 0.8) return { label: 'High', className: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (score >= 0.6) return { label: 'Medium', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
    return { label: 'Low', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const duration = endTime - startTime;
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleDelete = (clipId: string) => {
    toast({
      title: 'Clip deleted',
      description: 'The clip has been removed from your library.',
    });
  };

  const handleShare = (clipId: string, platform: string) => {
    toast({
      title: 'Sharing clip',
      description: `Opening ${platform} to share your clip...`,
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center animate-fade-down">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-gradient">My Clips</h2>
          <p className="text-gray-400">Manage and share your AI-generated highlights</p>
        </div>
        <Button className="btn-primary">
          <Download className="mr-2 h-4 w-4" />
          Export All
        </Button>
      </div>

      {/* Filters and Search */}
      <Card className="glass-dark border-0 animate-fade-up">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search clips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-800"
              />
            </div>
            
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
              <SelectTrigger className="w-[180px] bg-gray-900 border-gray-800">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="glass-dark border-gray-800">
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
                <SelectItem value="confidence">Highest Score</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <Card className="glass-dark border-0">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-400 mb-2">Failed to load clips</p>
            <p className="text-sm text-gray-500">{error.message}</p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="glass-dark border-0 overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-800" />
              <CardHeader className="pb-3">
                <div className="h-5 bg-gray-800 rounded mb-2" />
                <div className="h-4 bg-gray-800 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-800 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClips.length === 0 ? (
        <Card className="glass-dark border-0 text-center py-20">
          <CardContent>
            <div className="p-6 rounded-full glass-purple w-fit mx-auto mb-6">
              <Film className="h-12 w-12 text-purple-400" />
            </div>
            <p className="text-gray-400 mb-6 text-lg">No clips found</p>
            <p className="text-gray-500 mb-8">Process a VOD to generate your first clips</p>
            <Link href="/dashboard/vods">
              <Button className="btn-primary">
                Process VODs
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
          {filteredClips.map((clip) => {
            const confidence = getConfidenceBadge(clip.confidenceScore);
            
            return (
              <Card key={clip.id} className="glass-dark border-0 overflow-hidden hover:scale-[1.02] transition-all group">
                <div className="relative aspect-video bg-gray-900">
                  {(clip.thumbnailUrl || clip.vod.thumbnailUrl) ? (
                    <img 
                      src={(clip.thumbnailUrl || clip.vod.thumbnailUrl) as string} 
                      alt={clip.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between">
                    <Badge variant="outline" className={confidence.className}>
                      {confidence.label} Score
                    </Badge>
                    <Badge className="bg-black/60 backdrop-blur-sm">
                      {formatDuration(clip.startTime, clip.endTime)}
                    </Badge>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <Link href={`/dashboard/clips/${clip.id}/edit`}>
                      <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="icon" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Highlight indicators */}
                  <div className="absolute bottom-3 left-3 flex gap-2">
                    <div className="flex items-center gap-1 glass-dark px-2 py-1 rounded-full text-xs">
                      <Zap className="h-3 w-3 text-purple-400" />
                      <span className="text-purple-400">{Math.round(clip.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1 text-lg group-hover:text-purple-400 transition-colors">
                        {clip.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        from {clip.vod.title}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="glass-dark border-gray-800" align="end">
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleShare(clip.id, 'tiktok')}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-400"
                          onClick={() => handleDelete(clip.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
                    <span>{clip.vod.gameCategory || 'No category'}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(clip.createdAt), { addSuffix: true })}
                    </span>
                  </div>

                  {clip.keywords && clip.keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {clip.keywords.slice(0, 3).map((keyword, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-purple-500/10 text-purple-400 border-purple-500/30">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Link href={`/dashboard/clips/${clip.id}/edit`} className="flex-1">
                      <Button className="w-full btn-secondary" size="sm">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Clip
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline" className="border-gray-800 hover:bg-white/5">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {hasNextPage && (
        <div className="text-center animate-fade-up">
          <Button 
            variant="outline" 
            className="border-gray-800 hover:bg-white/5"
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