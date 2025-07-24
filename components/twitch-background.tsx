'use client';

import { useEffect, useRef } from 'react';

export function TwitchBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setSize();
    window.addEventListener('resize', setSize);

    // Twitch logo path
    const drawTwitchLogo = (x: number, y: number, size: number, opacity: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(size / 256, size / 268);
      ctx.fillStyle = `rgba(145, 70, 255, ${opacity})`;
      ctx.beginPath();
      // Twitch logo path
      ctx.moveTo(17.5, 0);
      ctx.lineTo(0, 46.9);
      ctx.lineTo(0, 233.1);
      ctx.lineTo(64.1, 233.1);
      ctx.lineTo(64.1, 268);
      ctx.lineTo(100, 268);
      ctx.lineTo(135.9, 233.1);
      ctx.lineTo(189.7, 233.1);
      ctx.lineTo(256, 166.8);
      ctx.lineTo(256, 0);
      ctx.closePath();
      ctx.fill();
      
      // Eyes
      ctx.fillStyle = `rgba(10, 10, 10, ${opacity})`;
      ctx.fillRect(104, 69.7, 23.3, 69.7);
      ctx.fillRect(168.1, 69.7, 23.3, 69.7);
      
      ctx.restore();
    };

    // Logo positions
    const logos = [
      { x: 100, y: 50, size: 300, opacity: 0.08, speed: 0.5 },
      { x: 600, y: 200, size: 200, opacity: 0.06, speed: 0.7 },
      { x: 300, y: 400, size: 150, opacity: 0.04, speed: 0.3 },
      { x: 800, y: 100, size: 250, opacity: 0.05, speed: 0.6 },
      { x: 150, y: 600, size: 180, opacity: 0.03, speed: 0.4 },
      { x: 500, y: 500, size: 120, opacity: 0.02, speed: 0.8 },
      { x: 900, y: 400, size: 200, opacity: 0.04, speed: 0.5 },
      { x: 50, y: 300, size: 100, opacity: 0.02, speed: 0.9 },
    ];

    let animationId: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      ctx.fillStyle = '#0a0a0a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw logos with animation
      logos.forEach((logo, index) => {
        const offsetX = Math.sin(time * logo.speed + index) * 20;
        const offsetY = Math.cos(time * logo.speed + index) * 10;
        drawTwitchLogo(
          logo.x + offsetX,
          logo.y + offsetY,
          logo.size,
          logo.opacity
        );
      });

      // Draw gradient overlay
      const gradient = ctx.createLinearGradient(
        canvas.width,
        0,
        0,
        canvas.height
      );
      gradient.addColorStop(0, 'rgba(10, 10, 10, 0.2)');
      gradient.addColorStop(0.3, 'rgba(10, 10, 10, 0.4)');
      gradient.addColorStop(0.5, 'rgba(10, 10, 10, 0.7)');
      gradient.addColorStop(0.7, 'rgba(10, 10, 10, 0.9)');
      gradient.addColorStop(1, 'rgba(10, 10, 10, 0.98)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.001;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: -2 }}
    />
  );
}