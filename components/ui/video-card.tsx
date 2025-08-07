import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface VOD {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  duration: number;
  viewCount?: number | null;
  gameCategory?: string | null;
}

export function VideoCard({ vod }: { vod: VOD }) {
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  const formatViewCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  return (
    <Card className="group overflow-hidden border-gray-800 bg-gradient-to-br from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 transition-all duration-300">
      <div className="relative">
        <img 
          src={vod.thumbnailUrl || '/placeholder-video.jpg'} 
          alt={vod.title}
          className="w-full aspect-video object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <Badge className="absolute top-2 right-2 bg-primary text-white">
          {formatDuration(vod.duration)}
        </Badge>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-2 line-clamp-2">{vod.title}</h3>
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>{vod.gameCategory || 'No category'}</span>
          {vod.viewCount && (
            <span>{formatViewCount(vod.viewCount)} views</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}