'use client';

import { useRef, useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  VolumeX,
  Maximize,
  Download,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  clipData?: {
    title: string;
    startTime: number;
    endTime: number;
    highlights?: Array<{
      timestamp: number;
      type: 'spike' | 'emote_burst' | 'hype_moment';
      intensity: number;
    }>;
  };
  onTimeUpdate?: (currentTime: number) => void;
  className?: string;
}

export function VideoPlayer({ src, poster, clipData, onTimeUpdate, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime);
    };

    const updateDuration = () => {
      setDuration(video.duration);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', () => setIsPlaying(false));
    };
  }, [onTimeUpdate]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = value[0];
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const skipBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, video.currentTime - 10);
  };

  const skipForward = () => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(duration, video.currentTime + 10);
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      ref={containerRef}
      className={cn("relative overflow-hidden bg-black", className)}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlayPause}
      />

      {/* Timeline with highlights */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800">
        <div 
          className="h-full bg-purple-600 transition-all"
          style={{ width: `${(currentTime / duration) * 100}%` }}
        />
        {clipData?.highlights?.map((highlight, i) => (
          <div
            key={i}
            className={cn(
              "absolute top-0 w-1 h-full",
              highlight.type === 'spike' && "bg-purple-400",
              highlight.type === 'emote_burst' && "bg-pink-400",
              highlight.type === 'hype_moment' && "bg-yellow-400"
            )}
            style={{ 
              left: `${(highlight.timestamp / duration) * 100}%`,
              opacity: highlight.intensity
            }}
          />
        ))}
      </div>

      {/* Controls */}
      <div className={cn(
        "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 transition-opacity duration-300",
        showControls ? "opacity-100" : "opacity-0"
      )}>
        {/* Progress bar */}
        <div className="mb-4">
          <Slider
            value={[currentTime]}
            max={duration}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={skipBackward}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={skipForward}
            >
              <SkipForward className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2 ml-4">
              <Button
                size="icon"
                variant="ghost"
                className="text-white hover:bg-white/20"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.1}
                onValueChange={handleVolumeChange}
                className="w-24"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="glass-dark border-gray-800">
                <DropdownMenuItem onClick={() => changePlaybackRate(0.5)}>
                  0.5x Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePlaybackRate(0.75)}>
                  0.75x Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePlaybackRate(1)}>
                  Normal Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePlaybackRate(1.25)}>
                  1.25x Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePlaybackRate(1.5)}>
                  1.5x Speed
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => changePlaybackRate(2)}>
                  2x Speed
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
            >
              <Download className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/20"
              onClick={toggleFullscreen}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Play button overlay */}
      {!isPlaying && showControls && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="icon"
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
            onClick={togglePlayPause}
          >
            <Play className="h-8 w-8 text-white ml-1" />
          </Button>
        </div>
      )}
    </Card>
  );
}