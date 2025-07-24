'use client';

import { useState, useCallback } from "react";
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
  AlertCircle,
  Sparkles,
  RefreshCw,
  Upload,
  Link2,
  Film,
  Zap
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { ProcessingStatus } from "@/components/processing-status";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function VODsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [processingVods, setProcessingVods] = useState<Set<string>>(new Set());
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [vodUrl, setVodUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();
  const utils = trpc.useContext();
  
  const { data, isLoading, error, fetchNextPage, hasNextPage, isFetchingNextPage } = trpc.vod.list.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );
  
  const analyzeVodMutation = trpc.vod.analyze.useMutation({
    onMutate: ({ vodId }) => {
      setProcessingVods(prev => new Set(prev).add(vodId));
    },
    onSuccess: (data) => {
      toast({
        title: "Analysis Started",
        description: "Your VOD is being analyzed. You'll be notified when clips are ready.",
      });
      utils.vod.list.invalidate();
    },
    onError: (error, { vodId }) => {
      setProcessingVods(prev => {
        const newSet = new Set(prev);
        newSet.delete(vodId);
        return newSet;
      });
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Handle dropped VOD URL or file
    const text = e.dataTransfer.getData('text');
    if (text && text.includes('twitch.tv')) {
      setVodUrl(text);
      setImportDialogOpen(true);
    }
  }, []);

  const vods = data?.pages.flatMap(page => page.vods) || [];
  const filteredVods = vods.filter(vod => 
    vod.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      case 'pending':
      case 'analyzing_chat':
      case 'generating_clips':
      case 'processing_video':
        return <Clock className="h-4 w-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      READY: "default",
      ANALYZED: "default",
      FAILED: "destructive",
      PENDING: "outline",
      PROCESSING: "secondary",
      completed: "default",
      failed: "destructive",
      pending: "secondary",
      analyzing_chat: "secondary",
      generating_clips: "secondary",
      processing_video: "secondary",
    };

    const colors: Record<string, string> = {
      READY: "bg-green-500/20 text-green-400 border-green-500/30",
      ANALYZED: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      FAILED: "bg-red-500/20 text-red-400 border-red-500/30",
      PENDING: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
      PROCESSING: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    };

    return (
      <Badge variant={variants[status] || "outline"} className={colors[status] || ""}>
        {status.replace(/_/g, ' ')}
      </Badge>
    );
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <ProcessingStatus />
      
      <div className="flex justify-between items-center animate-fade-down">
        <div>
          <h2 className="text-4xl font-bold mb-2 text-gradient">My VODs</h2>
          <p className="text-gray-400">Manage and process your Twitch VODs</p>
        </div>
        <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="btn-primary">
              <Plus className="mr-2 h-4 w-4" />
              Import VOD
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-dark border-gray-800">
            <DialogHeader>
              <DialogTitle>Import VOD</DialogTitle>
              <DialogDescription className="text-gray-400">
                Enter a Twitch VOD URL or drag and drop a link
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">VOD URL</label>
                <Input
                  placeholder="https://www.twitch.tv/videos/..."
                  value={vodUrl}
                  onChange={(e) => setVodUrl(e.target.value)}
                  className="bg-gray-900 border-gray-800"
                />
              </div>
              <Button className="w-full btn-primary">
                <Link2 className="mr-2 h-4 w-4" />
                Import VOD
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative animate-fade-up">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search VODs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 bg-gray-900 border-gray-800 focus:border-purple-500/50"
        />
      </div>

      {/* Drag and Drop Zone */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="glass-purple rounded-3xl p-12 text-center animate-scale-up">
            <Upload className="h-16 w-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Drop VOD URL here</h3>
            <p className="text-gray-400">Release to import the VOD</p>
          </div>
        </div>
      )}

      <div 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="min-h-[400px]"
      >
        {error ? (
          <Card className="glass-dark border-0">
            <CardContent className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 mb-2">Failed to load VODs</p>
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
        ) : filteredVods.length === 0 ? (
          <Card className="glass-dark border-0 animate-fade-up">
            <CardContent className="text-center py-20">
              <div className="p-6 rounded-full glass-purple w-fit mx-auto mb-6">
                <Film className="h-12 w-12 text-purple-400" />
              </div>
              <p className="text-gray-400 mb-6 text-lg">No VODs found</p>
              <p className="text-gray-500 mb-8">Import your first VOD to start creating viral clips</p>
              <Button className="btn-primary" onClick={() => setImportDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Import Your First VOD
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-stagger">
            {filteredVods.map((vod) => (
              <Card key={vod.id} className="glass-dark border-0 overflow-hidden hover:scale-[1.02] transition-all group">
                <div className="relative aspect-video bg-gray-900">
                  {vod.thumbnailUrl && (
                    <img 
                      src={vod.thumbnailUrl} 
                      alt={vod.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm">
                      {Math.floor(vod.duration / 3600)}h {Math.floor((vod.duration % 3600) / 60)}m
                    </Badge>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" className="bg-white/20 backdrop-blur-sm hover:bg-white/30">
                        <PlayCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <CardHeader className="pb-3">
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-purple-400 transition-colors">
                    {vod.title}
                  </CardTitle>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(vod.createdAt), { addSuffix: true })}
                    </span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(vod.processingStatus)}
                      {getStatusBadge(vod.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {vod.processingStatus !== 'pending' && vod.processingStatus !== 'completed' && (
                    <div className="mb-3">
                      <Progress value={vod.processingProgress} className="h-1.5 bg-gray-800" />
                      <p className="text-xs text-gray-500 mt-1">Processing... {vod.processingProgress}%</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {(vod.status === 'PENDING' || !vod.analyzedAt) && (
                      <Button 
                        className="flex-1 btn-primary" 
                        size="sm"
                        onClick={() => analyzeVodMutation.mutate({ vodId: vod.id })}
                        disabled={processingVods.has(vod.id) || analyzeVodMutation.isLoading}
                      >
                        {processingVods.has(vod.id) ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Zap className="mr-2 h-4 w-4" />
                            Analyze VOD
                          </>
                        )}
                      </Button>
                    )}
                    {vod.status === 'ANALYZED' && (
                      <>
                        <Button 
                          className="flex-1 btn-secondary" 
                          size="sm"
                          onClick={() => window.location.href = `/dashboard/vods/${vod.id}/clips`}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          View Clips ({vod._count.clips})
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-800 hover:bg-white/5"
                          onClick={() => analyzeVodMutation.mutate({ vodId: vod.id })}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {vod.status === 'PROCESSING' && (
                      <Button className="flex-1 btn-secondary" size="sm" disabled>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </Button>
                    )}
                    {vod.status === 'FAILED' && (
                      <Button 
                        className="flex-1" 
                        size="sm" 
                        variant="destructive"
                        onClick={() => analyzeVodMutation.mutate({ vodId: vod.id })}
                      >
                        Retry Analysis
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

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