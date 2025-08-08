'use client';

import { useEffect, useRef } from 'react';

export function AnimatedBackground({ fps = 30 }: { fps?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    type NavigatorWithConnection = Navigator & { connection?: { saveData?: boolean } };
    const saveData = Boolean((navigator as NavigatorWithConnection).connection?.saveData);
    const getDpr = () => (saveData ? 1 : Math.min(window.devicePixelRatio || 1, 1.5));

    const setCanvasSize = () => {
      const dpr = getDpr();
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    // Honor reduced motion
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    let prefersReducedMotion = mql.matches;

    // Particle setup
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];

    const colors = ['#b794f4', '#00d4ff', '#ff006e', '#00ff88'];

    const initParticles = () => {
      particles.length = 0;
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      const count = saveData ? 10 : 20;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.2,
          speedY: (Math.random() - 0.5) * 0.2,
          opacity: Math.random() * 0.1 + 0.05,
          color: colors[Math.floor(Math.random() * colors.length)]
        });
      }
    };

    setCanvasSize();
    initParticles();

    let animationId: number | null = null;
    let running = false;
    let isVisible = true;
    let lastTime = 0;
    const interval = 1000 / fps;

    const step = (now: number) => {
      if (!running) return;
      if (now - lastTime < interval) {
        animationId = requestAnimationFrame(step);
        return;
      }
      lastTime = now;

      ctx.fillStyle = 'rgba(10, 10, 10, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;

        const w = canvas.clientWidth || window.innerWidth;
        const h = canvas.clientHeight || window.innerHeight;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.shadowBlur = 5;
        ctx.shadowColor = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw subtle connections
      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 100) {
            ctx.globalAlpha = (1 - dist / 100) * 0.05;
            ctx.strokeStyle = a.color;
            ctx.lineWidth = 0.3;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(step);
    };

    const start = () => {
      if (running || prefersReducedMotion || !isVisible) return;
      running = true;
      lastTime = performance.now();
      animationId = requestAnimationFrame(step);
    };

    const stop = () => {
      running = false;
      if (animationId != null) {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    };

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    };

    // Observe viewport intersection (defensive; canvas is fixed by default)
    const observer = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0]?.isIntersecting ?? true;
        if (isVisible) start(); else stop();
      },
      { threshold: 0 }
    );
    observer.observe(canvas);

    // Listen for reduced motion changes
    const onMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        canvas.style.display = 'none';
        stop();
      } else {
        canvas.style.display = 'block';
        setCanvasSize();
        initParticles();
        start();
      }
    };

    // Initialize display state
    if (prefersReducedMotion) {
      canvas.style.display = 'none';
    } else {
      canvas.style.display = 'block';
      start();
    }

    const handleResize = () => {
      setCanvasSize();
      initParticles();
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('visibilitychange', onVisibility);
    if ('addEventListener' in mql) {
      mql.addEventListener('change', onMotionChange);
    } else {
      (mql as unknown as { addListener?: (cb: (e: MediaQueryListEvent) => void) => void }).addListener?.(onMotionChange);
    }

    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', onVisibility);
      if ('removeEventListener' in mql) {
        mql.removeEventListener('change', onMotionChange);
      } else {
        (mql as unknown as { removeListener?: (cb: (e: MediaQueryListEvent) => void) => void }).removeListener?.(onMotionChange);
      }
    };
  }, [fps]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}