'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Scissors, 
  Save, 
  Download,
  Smartphone,
  Monitor,
  Square,
  Maximize2,
  Type,
  Music,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Zap
} from 'lucide-react';
import { VideoPlayer } from './video-player';
import { cn } from '@/lib/utils';

interface ClipEditorProps {
  clip: {
    id: string;
    title: string;
    vodUrl: string;
    thumbnailUrl?: string;
    startTime: number;
    endTime: number;
    duration: number;
    highlights?: Array<{
      timestamp: number;
      type: 'spike' | 'emote_burst' | 'hype_moment';
      intensity: number;
    }>;
  };
  onSave?: (editedClip: any) => void;
  onExport?: (format: string) => void;
}

export function ClipEditor({ clip, onSave, onExport }: ClipEditorProps) {
  const [trimStart, setTrimStart] = useState(clip.startTime);
  const [trimEnd, setTrimEnd] = useState(clip.endTime);
  const [title, setTitle] = useState(clip.title);
  const [description, setDescription] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<'9:16' | '1:1' | '16:9'>('9:16');
  const [addCaptions, setAddCaptions] = useState(true);
  const [addMusic, setAddMusic] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.startTime);
  const timelineRef = useRef<HTMLDivElement>(null);

  const formats = {
    '9:16': { name: 'TikTok/Reels', icon: Smartphone, width: 1080, height: 1920 },
    '1:1': { name: 'Instagram', icon: Square, width: 1080, height: 1080 },
    '16:9': { name: 'YouTube', icon: Monitor, width: 1920, height: 1080 }
  };

  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = clip.startTime + (percentage * (clip.endTime - clip.startTime));
    
    setCurrentTime(time);
  }, [clip.startTime, clip.endTime]);

  const handleTrimHandleDrag = useCallback((e: React.MouseEvent, handle: 'start' | 'end') => {
    e.preventDefault();
    
    const startX = e.clientX;
    const startTime = handle === 'start' ? trimStart : trimEnd;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const timeline = timelineRef.current;
      if (!timeline) return;
      
      const deltaTime = (deltaX / timeline.offsetWidth) * (clip.endTime - clip.startTime);
      const newTime = Math.max(clip.startTime, Math.min(clip.endTime, startTime + deltaTime));
      
      if (handle === 'start') {
        setTrimStart(Math.min(newTime, trimEnd - 1));
      } else {
        setTrimEnd(Math.max(newTime, trimStart + 1));
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [clip.startTime, clip.endTime, trimStart, trimEnd]);

  const handleSave = () => {
    onSave?.({
      id: clip.id,
      title,
      description,
      startTime: trimStart,
      endTime: trimEnd,
      format: selectedFormat,
      addCaptions,
      addMusic
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const trimmedDuration = trimEnd - trimStart;

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      {/* Video Preview */}
      <div className="space-y-4">
        <Card className="glass-dark border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-purple-400" />
              Clip Editor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn(
              "relative mx-auto bg-black rounded-lg overflow-hidden",
              selectedFormat === '9:16' && "max-w-[360px] aspect-[9/16]",
              selectedFormat === '1:1' && "max-w-[480px] aspect-square",
              selectedFormat === '16:9' && "w-full aspect-video"
            )}>
              <VideoPlayer
                src={clip.vodUrl}
                poster={clip.thumbnailUrl}
                clipData={{
                  title: clip.title,
                  startTime: trimStart,
                  endTime: trimEnd,
                  highlights: clip.highlights
                }}
                onTimeUpdate={setCurrentTime}
                className="h-full"
              />
              
              {/* Format overlay */}
              <div className="absolute top-4 right-4 glass-dark px-3 py-1 rounded-full text-xs">
                {formats[selectedFormat].name}
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-400">
                <span>Timeline</span>
                <span>{formatTime(trimmedDuration)} clip</span>
              </div>
              
              <div 
                ref={timelineRef}
                className="relative h-16 bg-gray-900 rounded-lg cursor-pointer overflow-hidden"
                onClick={handleTimelineClick}
              >
                {/* Waveform visualization placeholder */}
                <div className="absolute inset-0 opacity-20">
                  {[...Array(50)].map((_, i) => (
                    <div
                      key={i}
                      className="inline-block w-[2%] h-full bg-purple-500"
                      style={{ 
                        height: `${30 + Math.random() * 40}%`,
                        marginTop: `${15 + Math.random() * 20}%`
                      }}
                    />
                  ))}
                </div>

                {/* Highlights */}
                {clip.highlights?.map((highlight, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 w-1 h-full",
                      highlight.type === 'spike' && "bg-purple-400",
                      highlight.type === 'emote_burst' && "bg-pink-400",
                      highlight.type === 'hype_moment' && "bg-yellow-400"
                    )}
                    style={{ 
                      left: `${((highlight.timestamp - clip.startTime) / (clip.endTime - clip.startTime)) * 100}%`,
                      opacity: highlight.intensity * 0.8
                    }}
                  />
                ))}

                {/* Trim area */}
                <div 
                  className="absolute top-0 h-full bg-purple-500/20 border-x-2 border-purple-500"
                  style={{
                    left: `${((trimStart - clip.startTime) / (clip.endTime - clip.startTime)) * 100}%`,
                    width: `${((trimEnd - trimStart) / (clip.endTime - clip.startTime)) * 100}%`
                  }}
                >
                  {/* Trim handles */}
                  <div
                    className="absolute left-0 top-0 w-4 h-full bg-purple-500 cursor-ew-resize hover:bg-purple-400 transition-colors flex items-center justify-center"
                    onMouseDown={(e) => handleTrimHandleDrag(e, 'start')}
                  >
                    <ChevronLeft className="h-3 w-3 text-white" />
                  </div>
                  <div
                    className="absolute right-0 top-0 w-4 h-full bg-purple-500 cursor-ew-resize hover:bg-purple-400 transition-colors flex items-center justify-center"
                    onMouseDown={(e) => handleTrimHandleDrag(e, 'end')}
                  >
                    <ChevronRight className="h-3 w-3 text-white" />
                  </div>
                </div>

                {/* Playhead */}
                <div 
                  className="absolute top-0 w-0.5 h-full bg-white"
                  style={{
                    left: `${((currentTime - clip.startTime) / (clip.endTime - clip.startTime)) * 100}%`
                  }}
                />
              </div>

              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatTime(trimStart)}</span>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(trimEnd)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Editor Controls */}
      <div className="space-y-4">
        {/* Clip Details */}
        <Card className="glass-dark border-0">
          <CardHeader>
            <CardTitle className="text-lg">Clip Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-900 border-gray-800"
                placeholder="Epic clutch moment"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="bg-gray-900 border-gray-800 min-h-[100px]"
                placeholder="Add a description for social media..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Export Format */}
        <Card className="glass-dark border-0">
          <CardHeader>
            <CardTitle className="text-lg">Export Format</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedFormat} onValueChange={(v) => setSelectedFormat(v as any)}>
              <TabsList className="grid grid-cols-3 w-full">
                {Object.entries(formats).map(([key, format]) => (
                  <TabsTrigger key={key} value={key} className="flex items-center gap-2">
                    <format.icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{format.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <TabsContent value={selectedFormat} className="mt-4 space-y-4">
                <div className="text-sm text-gray-400">
                  Resolution: {formats[selectedFormat].width} × {formats[selectedFormat].height}
                </div>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addCaptions}
                      onChange={(e) => setAddCaptions(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Type className="h-4 w-4 text-purple-400" />
                      <span>Auto-generate captions</span>
                    </div>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addMusic}
                      onChange={(e) => setAddMusic(e.target.checked)}
                      className="rounded border-gray-700 bg-gray-900 text-purple-600 focus:ring-purple-500"
                    />
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4 text-purple-400" />
                      <span>Add trending music</span>
                    </div>
                  </label>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <Card className="glass-purple border-0">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              <Zap className="h-3 w-3 mr-1" />
              High engagement moment detected
            </Badge>
            <p className="text-sm text-gray-400">
              This clip has 3 hype moments that could boost engagement by 45%
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            className="flex-1 btn-secondary"
            onClick={handleSave}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
          <Button
            className="flex-1 btn-primary"
            onClick={() => onExport?.(selectedFormat)}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Clip
          </Button>
        </div>
      </div>
    </div>
  );
}