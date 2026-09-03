/**
 * Wind Particle Renderer — GPU-friendly wind particle system.
 * Particle pool: max 1500 desktop, 400 mobile.
 * Adaptive count based on FPS for smooth rendering.
 */

import { createLogger } from '../../utils/logger';

const log = createLogger('WindParticleRenderer');

interface WindParticle {
  x: number;
  y: number;
  speed: number;
  direction: number; // radians
  age: number;
  maxAge: number;
  opacity: number;
}

export interface WindParticleConfig {
  density: number;      // 0–1 multiplier
  speedMultiplier: number;
  trailLength: number;  // pixels
  opacity: number;      // 0–1
  color: string;
}

const DEFAULT_CONFIG: WindParticleConfig = {
  density: 0.6,
  speedMultiplier: 1.0,
  trailLength: 8,
  opacity: 0.6,
  color: '#00e5ff',
};

export class WindParticleRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private particles: WindParticle[] = [];
  private animFrameId: number | null = null;
  private config: WindParticleConfig = { ...DEFAULT_CONFIG };
  private isMobile: boolean;
  private maxParticles: number;
  private isActive = false;

  constructor() {
    this.isMobile = window.innerWidth < 768 || 'ontouchstart' in window;
    this.maxParticles = this.isMobile ? 400 : 1500;
  }

  init(parentElement: HTMLElement): void {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'wind-particle-canvas';
    Object.assign(this.canvas.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: '70',
      display: 'none',
    });

    parentElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    log.info(`Wind particle renderer initialized (max: ${this.maxParticles})`);
  }

  setConfig(config: Partial<WindParticleConfig>): void {
    this.config = { ...this.config, ...config };
    this.updateParticleCount();
  }

  enable(): void {
    if (!this.canvas) return;
    this.isActive = true;
    this.canvas.style.display = 'block';
    this.initParticles();
    this.startRenderLoop();
    log.info('Wind particles enabled');
  }

  disable(): void {
    this.isActive = false;
    if (this.canvas) this.canvas.style.display = 'none';
    this.stopRenderLoop();
    this.particles = [];
    log.info('Wind particles disabled');
  }

  toggle(): void {
    if (this.isActive) this.disable();
    else this.enable();
  }

  // ---------------------------------------------------------------------------
  // Internal
  // ---------------------------------------------------------------------------

  private initParticles(): void {
    this.particles = [];
    const count = Math.floor(this.maxParticles * this.config.density);
    const w = this.canvas?.width ?? 800;
    const h = this.canvas?.height ?? 600;

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(w, h));
    }
  }

  private createParticle(w: number, h: number): WindParticle {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      speed: 0.5 + Math.random() * 2,
      direction: Math.random() * Math.PI * 2,
      age: 0,
      maxAge: 60 + Math.random() * 120,
      opacity: 0.2 + Math.random() * 0.6,
    };
  }

  private updateParticleCount(): void {
    const targetCount = Math.floor(this.maxParticles * this.config.density);
    const w = this.canvas?.width ?? 800;
    const h = this.canvas?.height ?? 600;

    while (this.particles.length < targetCount) {
      this.particles.push(this.createParticle(w, h));
    }
    while (this.particles.length > targetCount) {
      this.particles.pop();
    }
  }

  private startRenderLoop(): void {
    if (this.animFrameId !== null) return;

    const render = () => {
      this.update();
      this.draw();
      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private update(): void {
    const w = this.canvas?.width ?? 800;
    const h = this.canvas?.height ?? 600;
    const speedMul = this.config.speedMultiplier;

    for (const p of this.particles) {
      p.age++;
      p.x += Math.cos(p.direction) * p.speed * speedMul;
      p.y += Math.sin(p.direction) * p.speed * speedMul;

      // Slight direction drift for natural look
      p.direction += (Math.random() - 0.5) * 0.05;

      // Reset particle when aged out or off-screen
      if (p.age >= p.maxAge || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
        const newP = this.createParticle(w, h);
        p.x = newP.x;
        p.y = newP.y;
        p.speed = newP.speed;
        p.direction = newP.direction;
        p.age = 0;
        p.maxAge = newP.maxAge;
        p.opacity = newP.opacity;
      }
    }
  }

  private draw(): void {
    if (!this.ctx || !this.canvas) return;

    // Fade previous frame (creates trails)
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.strokeStyle = this.config.color;
    this.ctx.lineWidth = 1;

    for (const p of this.particles) {
      const alpha = p.opacity * this.config.opacity * (1 - p.age / p.maxAge);
      this.ctx.globalAlpha = Math.max(0, alpha);

      const dx = Math.cos(p.direction) * this.config.trailLength;
      const dy = Math.sin(p.direction) * this.config.trailLength;

      this.ctx.beginPath();
      this.ctx.moveTo(p.x, p.y);
      this.ctx.lineTo(p.x - dx, p.y - dy);
      this.ctx.stroke();
    }

    this.ctx.globalAlpha = 1;
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
  }

  dispose(): void {
    this.stopRenderLoop();
    if (this.canvas?.parentElement) {
      this.canvas.parentElement.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
  }
}
