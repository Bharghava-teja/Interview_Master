import React, { useEffect, useRef } from 'react';

const ParticleOverlay = () => {
  const canvasRef = useRef(null);
  const particles = useRef([]);
  const mouse = useRef({ x: null, y: null });

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    // Particle config
    const numParticles = Math.floor(width / 32);
    particles.current = Array.from({ length: numParticles }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 8 + Math.random() * 10,
      dx: (Math.random() - 0.5) * 0.7,
      dy: (Math.random() - 0.5) * 0.7,
      color: getComputedStyle(document.documentElement).getPropertyValue('--text-main') || '#6366f1',
      opacity: 0.12 + Math.random() * 0.18,
    }));

    function animate() {
      ctx.clearRect(0, 0, width, height);
      for (let p of particles.current) {
        // Mouse interaction
        if (mouse.current.x && mouse.current.y) {
          const dist = Math.hypot(p.x - mouse.current.x, p.y - mouse.current.y);
          if (dist < 120) {
            const angle = Math.atan2(p.y - mouse.current.y, p.x - mouse.current.x);
            p.x += Math.cos(angle) * 0.7;
            p.y += Math.sin(angle) * 0.7;
          }
        }
        // Move
        p.x += p.dx;
        p.y += p.dy;
        // Bounce
        if (p.x < 0 || p.x > width) p.dx *= -1;
        if (p.y < 0 || p.y > height) p.dy *= -1;
        // Draw
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
        ctx.fillStyle = p.color.trim() + Math.round(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.globalAlpha = p.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      requestAnimationFrame(animate);
    }
    animate();

    function handleResize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    }
    function handleMouse(e) {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
    }
    function handleTouch(e) {
      if (e.touches.length > 0) {
        mouse.current.x = e.touches[0].clientX;
        mouse.current.y = e.touches[0].clientY;
      }
    }
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouse);
    window.addEventListener('touchmove', handleTouch);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('touchmove', handleTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 0 }}
      aria-hidden
    />
  );
};

export default ParticleOverlay;