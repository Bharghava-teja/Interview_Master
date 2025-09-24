/**
 * Interactive Particle System Component
 * Creates dynamic particle effects for backgrounds and special interactions
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useAnimation, useMotionValue } from 'framer-motion';
import { useOptimizedAnimation } from '../hooks/useOptimizedAnimation';

// Particle class for individual particle behavior
class Particle {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // Position
    this.x = options.x || Math.random() * canvas.width;
    this.y = options.y || Math.random() * canvas.height;
    
    // Velocity
    this.vx = (Math.random() - 0.5) * (options.speed || 2);
    this.vy = (Math.random() - 0.5) * (options.speed || 2);
    
    // Properties
    this.size = options.size || Math.random() * 3 + 1;
    this.opacity = options.opacity || Math.random() * 0.5 + 0.3;
    this.color = options.color || `hsl(${Math.random() * 60 + 200}, 70%, 60%)`;
    
    // Animation properties
    this.life = 1;
    this.decay = options.decay || 0.005;
    this.bounce = options.bounce || false;
    this.gravity = options.gravity || 0;
    
    // Interactive properties
    this.mouseRadius = options.mouseRadius || 100;
    this.mouseForce = options.mouseForce || 0.1;
  }
  
  update(mouseX, mouseY) {
    // Mouse interaction
    if (mouseX !== null && mouseY !== null) {
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < this.mouseRadius) {
        const force = (this.mouseRadius - distance) / this.mouseRadius;
        const angle = Math.atan2(dy, dx);
        this.vx -= Math.cos(angle) * force * this.mouseForce;
        this.vy -= Math.sin(angle) * force * this.mouseForce;
      }
    }
    
    // Apply gravity
    this.vy += this.gravity;
    
    // Update position
    this.x += this.vx;
    this.y += this.vy;
    
    // Boundary handling
    if (this.bounce) {
      if (this.x <= 0 || this.x >= this.canvas.width) {
        this.vx *= -0.8;
        this.x = Math.max(0, Math.min(this.canvas.width, this.x));
      }
      if (this.y <= 0 || this.y >= this.canvas.height) {
        this.vy *= -0.8;
        this.y = Math.max(0, Math.min(this.canvas.height, this.y));
      }
    } else {
      // Wrap around
      if (this.x < 0) this.x = this.canvas.width;
      if (this.x > this.canvas.width) this.x = 0;
      if (this.y < 0) this.y = this.canvas.height;
      if (this.y > this.canvas.height) this.y = 0;
    }
    
    // Update life
    this.life -= this.decay;
    this.opacity = Math.max(0, this.life * 0.5);
  }
  
  draw() {
    this.ctx.save();
    this.ctx.globalAlpha = this.opacity;
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }
  
  isDead() {
    return this.life <= 0;
  }
}

// Main Particle System Component
export const ParticleSystem = ({
  particleCount = 50,
  particleColor = 'auto',
  particleSize = 2,
  particleSpeed = 1,
  mouseInteraction = true,
  connections = false,
  connectionDistance = 150,
  gravity = 0,
  bounce = false,
  className = '',
  style = {},
  variant = 'floating',
  intensity = 'medium'
}) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: null, y: null });
  const [isVisible, setIsVisible] = useState(true);
  const { shouldAnimate } = useOptimizedAnimation();
  
  // Intensity settings
  const intensitySettings = useMemo(() => {
    const settings = {
      low: { count: 20, speed: 0.5, size: 1.5, opacity: 0.3 },
      medium: { count: 50, speed: 1, size: 2, opacity: 0.5 },
      high: { count: 100, speed: 1.5, size: 2.5, opacity: 0.7 },
      extreme: { count: 200, speed: 2, size: 3, opacity: 0.8 }
    };
    return settings[intensity] || settings.medium;
  }, [intensity]);
  
  // Variant configurations
  const variantConfig = useMemo(() => {
    const configs = {
      floating: {
        gravity: 0,
        bounce: false,
        speed: intensitySettings.speed * 0.5,
        color: particleColor === 'auto' ? 'hsl(220, 70%, 60%)' : particleColor
      },
      falling: {
        gravity: 0.02,
        bounce: false,
        speed: intensitySettings.speed * 0.3,
        color: particleColor === 'auto' ? 'hsl(200, 80%, 70%)' : particleColor
      },
      bouncing: {
        gravity: 0.05,
        bounce: true,
        speed: intensitySettings.speed * 1.2,
        color: particleColor === 'auto' ? 'hsl(280, 70%, 65%)' : particleColor
      },
      explosive: {
        gravity: -0.01,
        bounce: false,
        speed: intensitySettings.speed * 2,
        color: particleColor === 'auto' ? 'hsl(30, 90%, 60%)' : particleColor
      },
      constellation: {
        gravity: 0,
        bounce: false,
        speed: intensitySettings.speed * 0.2,
        color: particleColor === 'auto' ? 'hsl(240, 50%, 80%)' : particleColor,
        connections: true
      }
    };
    return configs[variant] || configs.floating;
  }, [variant, intensitySettings, particleColor]);
  
  // Initialize particles
  const initializeParticles = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const count = intensitySettings.count;
    particlesRef.current = [];
    
    for (let i = 0; i < count; i++) {
      particlesRef.current.push(new Particle(canvas, {
        speed: variantConfig.speed,
        size: intensitySettings.size + Math.random() * 2,
        opacity: intensitySettings.opacity,
        color: variantConfig.color,
        gravity: variantConfig.gravity,
        bounce: variantConfig.bounce,
        mouseRadius: mouseInteraction ? 100 : 0,
        mouseForce: mouseInteraction ? 0.1 : 0
      }));
    }
  }, [intensitySettings, variantConfig, mouseInteraction]);
  
  // Handle mouse movement
  const handleMouseMove = useCallback((e) => {
    if (!mouseInteraction || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, [mouseInteraction]);
  
  const handleMouseLeave = useCallback(() => {
    mouseRef.current = { x: null, y: null };
  }, []);
  
  // Draw connections between nearby particles
  const drawConnections = useCallback((ctx, particles) => {
    if (!connections && !variantConfig.connections) return;
    
    ctx.save();
    ctx.strokeStyle = variantConfig.color;
    ctx.lineWidth = 0.5;
    
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < connectionDistance) {
          const opacity = (1 - distance / connectionDistance) * 0.3;
          ctx.globalAlpha = opacity;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
    
    ctx.restore();
  }, [connections, variantConfig, connectionDistance]);
  
  // Animation loop
  const animate = useCallback(() => {
    if (!canvasRef.current || !shouldAnimate) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    const particles = particlesRef.current;
    const mouse = mouseRef.current;
    
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.update(mouse.x, mouse.y);
      
      if (particle.isDead()) {
        // Replace dead particle with new one
        particles[i] = new Particle(canvas, {
          speed: variantConfig.speed,
          size: intensitySettings.size + Math.random() * 2,
          opacity: intensitySettings.opacity,
          color: variantConfig.color,
          gravity: variantConfig.gravity,
          bounce: variantConfig.bounce,
          mouseRadius: mouseInteraction ? 100 : 0,
          mouseForce: mouseInteraction ? 0.1 : 0
        });
      } else {
        particle.draw();
      }
    }
    
    // Draw connections
    drawConnections(ctx, particles);
    
    animationRef.current = requestAnimationFrame(animate);
  }, [shouldAnimate, variantConfig, intensitySettings, mouseInteraction, drawConnections]);
  
  // Resize handler
  const handleResize = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const container = canvas.parentElement;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Reinitialize particles with new canvas size
    initializeParticles();
  }, [initializeParticles]);
  
  // Setup and cleanup
  useEffect(() => {
    if (!shouldAnimate) return;
    
    handleResize();
    animate();
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [shouldAnimate, handleResize, animate]);
  
  // Visibility observer for performance
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    
    observer.observe(canvasRef.current);
    
    return () => observer.disconnect();
  }, []);
  
  // Pause animation when not visible
  useEffect(() => {
    if (!isVisible && animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    } else if (isVisible && shouldAnimate) {
      animate();
    }
  }, [isVisible, shouldAnimate, animate]);
  
  if (!shouldAnimate) {
    return null;
  }
  
  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ pointerEvents: mouseInteraction ? 'auto' : 'none' }}
      />
    </div>
  );
};

// Preset particle effects
export const FloatingParticles = (props) => (
  <ParticleSystem variant="floating" intensity="medium" {...props} />
);

export const FallingParticles = (props) => (
  <ParticleSystem variant="falling" intensity="medium" {...props} />
);

export const BouncingParticles = (props) => (
  <ParticleSystem variant="bouncing" intensity="low" {...props} />
);

export const ExplosiveParticles = (props) => (
  <ParticleSystem variant="explosive" intensity="high" {...props} />
);

export const ConstellationEffect = (props) => (
  <ParticleSystem 
    variant="constellation" 
    intensity="low" 
    connections={true}
    connectionDistance={120}
    {...props} 
  />
);

// Interactive particle burst effect
export const ParticleBurst = ({ 
  x, 
  y, 
  particleCount = 20, 
  color = 'hsl(60, 100%, 70%)',
  onComplete 
}) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Create burst particles
    particlesRef.current = [];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = Math.random() * 5 + 2;
      
      particlesRef.current.push(new Particle(canvas, {
        x,
        y,
        speed: 0,
        size: Math.random() * 4 + 2,
        color,
        decay: 0.02,
        gravity: 0.1
      }));
      
      // Set initial velocity
      const particle = particlesRef.current[i];
      particle.vx = Math.cos(angle) * speed;
      particle.vy = Math.sin(angle) * speed;
    }
    
    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let aliveCount = 0;
      particlesRef.current.forEach(particle => {
        particle.update();
        if (!particle.isDead()) {
          particle.draw();
          aliveCount++;
        }
      });
      
      if (aliveCount > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else if (onComplete) {
        onComplete();
      }
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [x, y, particleCount, color, onComplete]);
  
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none w-full h-full"
    />
  );
};

export default {
  ParticleSystem,
  FloatingParticles,
  FallingParticles,
  BouncingParticles,
  ExplosiveParticles,
  ConstellationEffect,
  ParticleBurst
};