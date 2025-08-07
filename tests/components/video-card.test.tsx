import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { VideoCard } from '@/components/ui/video-card';

describe('VideoCard Component', () => {
  const mockVod = {
    id: '123',
    title: 'Test Stream VOD',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    duration: 7200, // 2 hours
    viewCount: 5500,
    gameCategory: 'Just Chatting'
  };

  it('should render video card with all props', () => {
    render(<VideoCard vod={mockVod} />);
    
    expect(screen.getByText('Test Stream VOD')).toBeInTheDocument();
    expect(screen.getByText('2h 0m')).toBeInTheDocument();
    expect(screen.getByText('5.5K views')).toBeInTheDocument();
    expect(screen.getByText('Just Chatting')).toBeInTheDocument();
    
    const image = screen.getByAltText('Test Stream VOD');
    expect(image).toHaveAttribute('src', 'https://example.com/thumbnail.jpg');
  });

  it('should render placeholder image when thumbnailUrl is null', () => {
    const vodWithoutThumbnail = { ...mockVod, thumbnailUrl: null };
    render(<VideoCard vod={vodWithoutThumbnail} />);
    
    const image = screen.getByAltText('Test Stream VOD');
    expect(image).toHaveAttribute('src', '/placeholder-video.jpg');
  });

  it('should render placeholder image when thumbnailUrl is undefined', () => {
    const vodWithoutThumbnail = { ...mockVod, thumbnailUrl: undefined };
    render(<VideoCard vod={vodWithoutThumbnail} />);
    
    const image = screen.getByAltText('Test Stream VOD');
    expect(image).toHaveAttribute('src', '/placeholder-video.jpg');
  });

  it('should format duration correctly for hours and minutes', () => {
    const testCases = [
      { duration: 3600, expected: '1h 0m' },     // 1 hour
      { duration: 5400, expected: '1h 30m' },    // 1.5 hours
      { duration: 7260, expected: '2h 1m' },     // 2 hours 1 minute
      { duration: 10800, expected: '3h 0m' },    // 3 hours
    ];

    testCases.forEach(({ duration, expected }) => {
      const { rerender } = render(<VideoCard vod={{ ...mockVod, duration }} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear for next test
    });
  });

  it('should format duration correctly for minutes only', () => {
    const testCases = [
      { duration: 60, expected: '1m' },      // 1 minute
      { duration: 300, expected: '5m' },     // 5 minutes
      { duration: 1800, expected: '30m' },   // 30 minutes
      { duration: 3540, expected: '59m' },   // 59 minutes
    ];

    testCases.forEach(({ duration, expected }) => {
      const { rerender } = render(<VideoCard vod={{ ...mockVod, duration }} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear for next test
    });
  });

  it('should format view count correctly', () => {
    const testCases = [
      { viewCount: 999, expected: '999 views' },
      { viewCount: 1000, expected: '1.0K views' },
      { viewCount: 1500, expected: '1.5K views' },
      { viewCount: 10000, expected: '10.0K views' },
      { viewCount: 999999, expected: '1000.0K views' },
      { viewCount: 1000000, expected: '1.0M views' },
      { viewCount: 1500000, expected: '1.5M views' },
      { viewCount: 10000000, expected: '10.0M views' },
    ];

    testCases.forEach(({ viewCount, expected }) => {
      const { rerender } = render(<VideoCard vod={{ ...mockVod, viewCount }} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear for next test
    });
  });

  it('should not render view count when null', () => {
    render(<VideoCard vod={{ ...mockVod, viewCount: null }} />);
    expect(screen.queryByText('views')).not.toBeInTheDocument();
  });

  it('should not render view count when undefined', () => {
    const vodWithoutViews = { ...mockVod };
    delete vodWithoutViews.viewCount;
    render(<VideoCard vod={vodWithoutViews} />);
    expect(screen.queryByText('views')).not.toBeInTheDocument();
  });

  it('should render "No category" when gameCategory is null', () => {
    render(<VideoCard vod={{ ...mockVod, gameCategory: null }} />);
    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('should render "No category" when gameCategory is undefined', () => {
    const vodWithoutCategory = { ...mockVod };
    delete vodWithoutCategory.gameCategory;
    render(<VideoCard vod={vodWithoutCategory} />);
    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('should render "No category" when gameCategory is empty string', () => {
    render(<VideoCard vod={{ ...mockVod, gameCategory: '' }} />);
    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('should handle long titles with line clamp', () => {
    const longTitle = 'This is a very long stream title that should be clamped to two lines when displayed in the video card component to ensure proper layout';
    render(<VideoCard vod={{ ...mockVod, title: longTitle }} />);
    
    const titleElement = screen.getByText(longTitle);
    expect(titleElement).toBeInTheDocument();
    expect(titleElement).toHaveClass('line-clamp-2');
  });

  it('should apply hover effects via group class', () => {
    render(<VideoCard vod={mockVod} />);
    
    const card = screen.getByText('Test Stream VOD').closest('.group');
    expect(card).toHaveClass('group');
    expect(card).toHaveClass('hover:from-gray-800');
    expect(card).toHaveClass('hover:to-gray-700');
  });

  it('should render duration badge with correct styling', () => {
    render(<VideoCard vod={mockVod} />);
    
    const badge = screen.getByText('2h 0m');
    expect(badge).toHaveClass('bg-primary');
    expect(badge).toHaveClass('text-white');
  });

  it('should handle edge case durations', () => {
    const edgeCases = [
      { duration: 0, expected: '0m' },
      { duration: 59, expected: '0m' },  // Less than a minute rounds down
      { duration: 86400, expected: '24h 0m' }, // 24 hours
    ];

    edgeCases.forEach(({ duration, expected }) => {
      const { rerender } = render(<VideoCard vod={{ ...mockVod, duration }} />);
      expect(screen.getByText(expected)).toBeInTheDocument();
      rerender(<div />); // Clear for next test
    });
  });

  it('should handle edge case view counts', () => {
    // Test viewCount = 0 (should not render)
    const { rerender } = render(<VideoCard vod={{ ...mockVod, viewCount: 0 }} />);
    expect(screen.queryByText('views')).not.toBeInTheDocument();
    
    // Test viewCount = 1 (should render "1 views")
    rerender(<VideoCard vod={{ ...mockVod, viewCount: 1 }} />);
    expect(screen.getByText('1 views')).toBeInTheDocument();
  });
});