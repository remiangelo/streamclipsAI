'use client';

import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, MessageSquare, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatActivityData {
  timestamp: number;
  messageCount: number;
  emoteCount: number;
  sentiment: number;
  highlights: Array<{
    timestamp: number;
    type: 'spike' | 'emote_burst' | 'hype_moment';
    intensity: number;
  }>;
}

interface ChatActivityChartProps {
  data: ChatActivityData[];
  duration: number;
  className?: string;
  onTimestampClick?: (timestamp: number) => void;
}

export function ChatActivityChart({ data, duration, className, onTimestampClick }: ChatActivityChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; data: ChatActivityData } | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !data.length || dimensions.width === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    canvas.width = dimensions.width * window.devicePixelRatio;
    canvas.height = dimensions.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);

    // Calculate scales
    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    const chartHeight = dimensions.height - padding.top - padding.bottom;

    const maxMessages = Math.max(...data.map(d => d.messageCount));
    const xScale = (timestamp: number) => (timestamp / duration) * chartWidth + padding.left;
    const yScale = (value: number) => chartHeight - (value / maxMessages) * chartHeight + padding.top;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(dimensions.width - padding.right, y);
      ctx.stroke();
    }

    // Draw highlights
    data.forEach((point) => {
      point.highlights.forEach((highlight) => {
        const x = xScale(highlight.timestamp);
        const intensity = highlight.intensity;
        
        // Draw highlight bar
        const gradient = ctx.createLinearGradient(x, padding.top, x, dimensions.height - padding.bottom);
        if (highlight.type === 'spike') {
          gradient.addColorStop(0, `rgba(147, 51, 234, ${0.2 * intensity})`);
          gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');
        } else if (highlight.type === 'emote_burst') {
          gradient.addColorStop(0, `rgba(236, 72, 153, ${0.2 * intensity})`);
          gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
        } else {
          gradient.addColorStop(0, `rgba(234, 179, 8, ${0.2 * intensity})`);
          gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 2, padding.top, 4, chartHeight);
      });
    });

    // Draw activity line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(147, 51, 234, 0.8)';
    ctx.lineWidth = 2;
    
    const gradient = ctx.createLinearGradient(0, padding.top, 0, dimensions.height - padding.bottom);
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.3)');
    gradient.addColorStop(1, 'rgba(147, 51, 234, 0)');

    data.forEach((point, index) => {
      const x = xScale(point.timestamp);
      const y = yScale(point.messageCount);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Fill area under line
    ctx.lineTo(xScale(data[data.length - 1].timestamp), dimensions.height - padding.bottom);
    ctx.lineTo(xScale(data[0].timestamp), dimensions.height - padding.bottom);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw emote activity line
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.6)';
    ctx.lineWidth = 1.5;
    
    data.forEach((point, index) => {
      const x = xScale(point.timestamp);
      const y = yScale(point.emoteCount);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();

    // Draw axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, padding.top);
    ctx.lineTo(padding.left, dimensions.height - padding.bottom);
    ctx.stroke();
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding.left, dimensions.height - padding.bottom);
    ctx.lineTo(dimensions.width - padding.right, dimensions.height - padding.bottom);
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px Inter';
    
    // Y-axis labels
    for (let i = 0; i <= 5; i++) {
      const value = Math.round((maxMessages / 5) * (5 - i));
      const y = padding.top + (chartHeight / 5) * i;
      ctx.fillText(value.toString(), padding.left - 35, y + 4);
    }

    // X-axis labels
    const timeLabels = ['0:00', '0:30', '1:00', '1:30', '2:00'];
    timeLabels.forEach((label, i) => {
      const x = padding.left + (chartWidth / (timeLabels.length - 1)) * i;
      ctx.fillText(label, x - 15, dimensions.height - padding.bottom + 20);
    });

  }, [data, duration, dimensions]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data.length) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    
    // Find closest data point
    const relativeX = (x - padding.left) / chartWidth;
    const timestamp = relativeX * duration;
    
    const closestPoint = data.reduce((prev, curr) => {
      return Math.abs(curr.timestamp - timestamp) < Math.abs(prev.timestamp - timestamp) ? curr : prev;
    });

    const pointX = (closestPoint.timestamp / duration) * chartWidth + padding.left;
    const maxMessages = Math.max(...data.map(d => d.messageCount));
    const chartHeight = dimensions.height - padding.top - padding.bottom;
    const pointY = chartHeight - (closestPoint.messageCount / maxMessages) * chartHeight + padding.top;

    setHoveredPoint({ x: pointX, y: pointY, data: closestPoint });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !data.length || !onTimestampClick) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const chartWidth = dimensions.width - padding.left - padding.right;
    
    const relativeX = (x - padding.left) / chartWidth;
    const timestamp = Math.max(0, Math.min(duration, relativeX * duration));
    
    onTimestampClick(timestamp);
  };

  return (
    <Card className={cn("glass-dark border-0 p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <TrendingUp className="h-4 w-4 text-purple-400" />
            </div>
            Chat Activity Analysis
          </h3>
          <p className="text-sm text-gray-400 mt-1">Click on the chart to jump to specific moments</p>
        </div>
        <div className="flex gap-2">
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
            <MessageSquare className="h-3 w-3 mr-1" />
            Messages
          </Badge>
          <Badge variant="outline" className="bg-pink-500/10 text-pink-400 border-pink-500/30">
            <Sparkles className="h-3 w-3 mr-1" />
            Emotes
          </Badge>
        </div>
      </div>

      <div ref={containerRef} className="relative h-64">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {hoveredPoint && (
          <div
            className="absolute glass-purple rounded-lg p-3 pointer-events-none animate-fade-in"
            style={{
              left: hoveredPoint.x + 10,
              top: hoveredPoint.y - 40,
              transform: 'translateX(-50%)'
            }}
          >
            <div className="text-xs space-y-1">
              <div className="font-semibold text-white">
                {formatTime(hoveredPoint.data.timestamp)}
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-3 w-3 text-purple-400" />
                <span>{hoveredPoint.data.messageCount} messages</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-pink-400" />
                <span>{hoveredPoint.data.emoteCount} emotes</span>
              </div>
              {hoveredPoint.data.highlights.length > 0 && (
                <div className="flex items-center gap-1 mt-1">
                  <Zap className="h-3 w-3 text-yellow-400" />
                  <span className="text-yellow-400">Highlight moment!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-400">
            {data.reduce((sum, d) => sum + d.highlights.filter(h => h.type === 'spike').length, 0)}
          </div>
          <div className="text-xs text-gray-400">Activity Spikes</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-pink-400">
            {data.reduce((sum, d) => sum + d.highlights.filter(h => h.type === 'emote_burst').length, 0)}
          </div>
          <div className="text-xs text-gray-400">Emote Bursts</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {data.reduce((sum, d) => sum + d.highlights.filter(h => h.type === 'hype_moment').length, 0)}
          </div>
          <div className="text-xs text-gray-400">Hype Moments</div>
        </div>
      </div>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}