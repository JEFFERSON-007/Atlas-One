/**
 * AnimationController — Manages GSAP-powered landing sequence,
 * camera approach animations, and transition effects.
 */

import { gsap } from 'gsap';
import {
  Cartesian3,
  type Viewer,
} from 'cesium';
import { DEFAULT_CAMERA } from '../../../config/cesium.config';
import { createLogger } from '../../../utils/logger';
import { prefersReducedMotion } from '../../../utils/device';
import { eventBus } from '../../../hooks/use-event-bus';

const log = createLogger('AnimationController');

/**
 * Controls GSAP-powered cinematic animations including the landing sequence.
 */
export class AnimationController {
  private viewer: Viewer | null = null;
  private timeline: gsap.core.Timeline | null = null;

  /**
   * Initializes the animation controller.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;
    log.info('Animation controller initialized');
  }

  /**
   * Plays the cinematic landing sequence:
   * 1. Splash screen fades to reveal stars
   * 2. Camera starts far from Earth
   * 3. Camera smoothly approaches the globe
   * 4. UI elements fade in
   *
   * Respects prefers-reduced-motion by skipping animations.
   */
  async playLandingSequence(): Promise<void> {
    const splash = document.getElementById('splash-screen');
    const uiOverlay = document.getElementById('ui-overlay');
    const cesiumContainer = document.getElementById('cesium-container');

    if (!splash || !this.viewer) {
      log.warn('Missing splash screen or viewer — skipping landing animation');
      return;
    }

    // Reduced motion: skip all animations
    if (prefersReducedMotion()) {
      log.info('Reduced motion preferred — skipping landing animation');
      splash.style.display = 'none';
      if (uiOverlay) uiOverlay.style.opacity = '1';
      eventBus.emit('animation:complete', { name: 'landing' });
      return;
    }

    // Hide UI during animation
    if (uiOverlay) uiOverlay.style.opacity = '0';

    // Start camera far away
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        DEFAULT_CAMERA.longitude,
        DEFAULT_CAMERA.latitude,
        DEFAULT_CAMERA.height * 2.5, // Start very far
      ),
    });

    // Create GSAP timeline
    this.timeline = gsap.timeline({
      onComplete: () => {
        eventBus.emit('animation:complete', { name: 'landing' });
        log.info('Landing sequence complete');
      },
    });

    // Phase 1: Fade out splash screen (1.5s)
    this.timeline.to(splash, {
      opacity: 0,
      duration: 1.5,
      ease: 'power2.inOut',
      onComplete: () => {
        splash.style.display = 'none';
      },
    });

    // Phase 2: Camera approach animation (3s)
    const cameraProxy = { height: DEFAULT_CAMERA.height * 2.5 };
    this.timeline.to(
      cameraProxy,
      {
        height: DEFAULT_CAMERA.height,
        duration: 3,
        ease: 'power2.out',
        onUpdate: () => {
          if (this.viewer && !this.viewer.isDestroyed()) {
            this.viewer.camera.setView({
              destination: Cartesian3.fromDegrees(
                DEFAULT_CAMERA.longitude,
                DEFAULT_CAMERA.latitude,
                cameraProxy.height,
              ),
            });
          }
        },
      },
      '-=0.8', // Overlap with splash fade
    );

    // Phase 3: Fade in UI (1s)
    if (uiOverlay) {
      this.timeline.to(
        uiOverlay,
        {
          opacity: 1,
          duration: 1,
          ease: 'power2.out',
        },
        '-=0.5',
      );
    }

    // Phase 4: Subtle Cesium container glow (if container exists)
    if (cesiumContainer) {
      this.timeline.fromTo(
        cesiumContainer,
        { filter: 'brightness(0.3)' },
        {
          filter: 'brightness(1)',
          duration: 2,
          ease: 'power1.inOut',
        },
        0.5, // Start at 0.5s
      );
    }

    // Wait for timeline to complete
    return new Promise((resolve) => {
      if (this.timeline) {
        this.timeline.eventCallback('onComplete', () => resolve());
      } else {
        resolve();
      }
    });
  }

  /**
   * Cancels any running animation.
   */
  cancel(): void {
    if (this.timeline) {
      this.timeline.kill();
      this.timeline = null;
    }
  }

  /**
   * Cleans up animation resources.
   */
  dispose(): void {
    this.cancel();
    this.viewer = null;
    log.info('Animation controller disposed');
  }
}
