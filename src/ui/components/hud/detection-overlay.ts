/**
 * DetectionOverlay — Screen-space bounding boxes and entity labels.
 * Projects 3D entity positions to 2D screen coordinates and draws
 * tactical identification boxes around each visible entity.
 */

import type { Viewer } from 'cesium';
import {
  Cartesian3,
  SceneTransforms,
  Cartographic,
  Math as CesiumMath,
  Ellipsoid,
} from 'cesium';
import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';
import { eventBus } from '../../../hooks/use-event-bus';

const log = createLogger('DetectionOverlay');

interface DetectedEntity {
  id: string;
  label: string;
  type: string;
  position: Cartesian3;
  icon: string;
}

const TYPE_COLORS: Record<string, string> = {
  earthquake: '#ff4444',
  wildfire: '#ff8800',
  volcano: '#ff2200',
  storm: '#8888ff',
  tsunami: '#00ccff',
  lightning: '#ffff00',
  flight: '#00ff88',
  satellite: '#88ccff',
  ship: '#00cccc',
  iss: '#ffffff',
  city: '#cccc00',
  airport: '#44ff44',
  default: '#00ff66',
};

export class DetectionOverlay {
  private viewer: Viewer | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private isVisible = false;
  private animFrameId: number | null = null;
  private detectedCount = 0;

  init(parentId: string, viewer: Viewer): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.viewer = viewer;

    this.canvas = createElement('canvas', {
      id: 'detection-overlay',
      style: `
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 75;
        display: none;
      `,
    }) as unknown as HTMLCanvasElement;

    parent.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.resizeCanvas();

    window.addEventListener('resize', () => this.resizeCanvas());
    log.info('Detection overlay initialized');
  }

  toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.canvas) {
      this.canvas.style.display = this.isVisible ? 'block' : 'none';
    }
    if (this.isVisible) {
      this.startRenderLoop();
    } else {
      this.stopRenderLoop();
    }
    log.info(`Detection overlay ${this.isVisible ? 'ON' : 'OFF'}`);
  }

  isActive(): boolean {
    return this.isVisible;
  }

  getDetectedCount(): number {
    return this.detectedCount;
  }

  private resizeCanvas(): void {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (rect) {
      this.canvas.width = rect.width * window.devicePixelRatio;
      this.canvas.height = rect.height * window.devicePixelRatio;
    }
  }

  private startRenderLoop(): void {
    const tick = (): void => {
      this.render();
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private render(): void {
    if (!this.ctx || !this.viewer || !this.canvas) return;

    const dpr = window.devicePixelRatio;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.scale(dpr, dpr);

    const entities = this.gatherEntities();
    this.detectedCount = entities.length;

    // Update entity count in HUD
    const hudEntities = document.getElementById('hud-entities');
    if (hudEntities) {
      hudEntities.textContent = `ENTITIES: ${this.detectedCount}`;
    }

    for (const entity of entities) {
      this.drawDetectionBox(entity);
    }

    // Reset transform
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
  }

  private gatherEntities(): DetectedEntity[] {
    if (!this.viewer) return [];
    const entities: DetectedEntity[] = [];
    const maxEntities = 50; // Performance cap

    // Gather from CesiumJS entity collection
    const collection = this.viewer.entities.values;
    for (const entity of collection) {
      if (entities.length >= maxEntities) break;
      if (!entity.position || !entity.show) continue;

      const pos = entity.position.getValue(this.viewer.clock.currentTime);
      if (!pos) continue;

      // Check if entity is in view
      const screenPos = SceneTransforms.worldToWindowCoordinates(
        this.viewer.scene,
        pos,
      );
      if (!screenPos) continue;

      const name = entity.name ?? entity.id;
      const entityType = this.classifyEntity(name);

      entities.push({
        id: entity.id,
        label: name.length > 20 ? name.slice(0, 20) + '…' : name,
        type: entityType,
        position: pos,
        icon: this.getTypeIcon(entityType),
      });
    }

    return entities;
  }

  private classifyEntity(name: string): string {
    const lower = name.toLowerCase();
    if (lower.includes('earthquake') || lower.includes('quake')) return 'earthquake';
    if (lower.includes('fire') || lower.includes('wildfire')) return 'wildfire';
    if (lower.includes('volcano')) return 'volcano';
    if (lower.includes('storm') || lower.includes('cyclone') || lower.includes('hurricane')) return 'storm';
    if (lower.includes('tsunami')) return 'tsunami';
    if (lower.includes('lightning')) return 'lightning';
    if (lower.includes('flight') || lower.includes('aircraft') || lower.includes('plane')) return 'flight';
    if (lower.includes('satellite') || lower.includes('starlink') || lower.includes('gps')) return 'satellite';
    if (lower.includes('ship') || lower.includes('vessel')) return 'ship';
    if (lower.includes('iss')) return 'iss';
    return 'default';
  }

  private getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      earthquake: '◆',
      wildfire: '🔥',
      volcano: '▲',
      storm: '⊛',
      tsunami: '≋',
      lightning: '⚡',
      flight: '✈',
      satellite: '◎',
      ship: '⊞',
      iss: '◉',
      default: '◇',
    };
    return icons[type] ?? icons['default'];
  }

  private drawDetectionBox(entity: DetectedEntity): void {
    if (!this.ctx || !this.viewer) return;

    const screenPos = SceneTransforms.worldToWindowCoordinates(
      this.viewer.scene,
      entity.position,
    );
    if (!screenPos) return;

    const x = screenPos.x;
    const y = screenPos.y;
    const boxW = 80;
    const boxH = 32;
    const color = TYPE_COLORS[entity.type] ?? TYPE_COLORS['default'];

    // Box outline
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;
    this.ctx.globalAlpha = 0.8;
    this.ctx.strokeRect(x - boxW / 2, y - boxH / 2, boxW, boxH);

    // Corner ticks
    const tickLen = 6;
    this.ctx.lineWidth = 2;
    // TL
    this.ctx.beginPath();
    this.ctx.moveTo(x - boxW / 2, y - boxH / 2 + tickLen);
    this.ctx.lineTo(x - boxW / 2, y - boxH / 2);
    this.ctx.lineTo(x - boxW / 2 + tickLen, y - boxH / 2);
    this.ctx.stroke();
    // TR
    this.ctx.beginPath();
    this.ctx.moveTo(x + boxW / 2 - tickLen, y - boxH / 2);
    this.ctx.lineTo(x + boxW / 2, y - boxH / 2);
    this.ctx.lineTo(x + boxW / 2, y - boxH / 2 + tickLen);
    this.ctx.stroke();
    // BL
    this.ctx.beginPath();
    this.ctx.moveTo(x - boxW / 2, y + boxH / 2 - tickLen);
    this.ctx.lineTo(x - boxW / 2, y + boxH / 2);
    this.ctx.lineTo(x - boxW / 2 + tickLen, y + boxH / 2);
    this.ctx.stroke();
    // BR
    this.ctx.beginPath();
    this.ctx.moveTo(x + boxW / 2 - tickLen, y + boxH / 2);
    this.ctx.lineTo(x + boxW / 2, y + boxH / 2);
    this.ctx.lineTo(x + boxW / 2, y + boxH / 2 - tickLen);
    this.ctx.stroke();

    // Label
    this.ctx.font = '9px "Courier New", monospace';
    this.ctx.fillStyle = color;
    this.ctx.globalAlpha = 0.9;
    this.ctx.fillText(
      `${entity.icon} ${entity.label}`,
      x - boxW / 2 + 3,
      y - boxH / 2 - 4,
    );

    // Distance line from center
    this.ctx.globalAlpha = 0.2;
    this.ctx.lineWidth = 0.5;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    const cx = (this.canvas?.width ?? 0) / (2 * window.devicePixelRatio);
    const cy = (this.canvas?.height ?? 0) / (2 * window.devicePixelRatio);
    this.ctx.lineTo(cx, cy);
    this.ctx.stroke();

    this.ctx.globalAlpha = 1;
  }

  dispose(): void {
    this.stopRenderLoop();
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    log.info('Detection overlay disposed');
  }
}
