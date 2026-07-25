/**
 * CameraController — Manages camera interactions, fly-to animations,
 * keyboard navigation, auto-rotate, and view reset.
 */

import {
  Cartesian2,
  Cartesian3,
  Math as CesiumMath,
  type Viewer,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Cartographic,
  defined,
  Ellipsoid,
} from 'cesium';

import { DEFAULT_CAMERA, FLY_TO_DEFAULTS, CAMERA_LIMITS } from '../../../config/cesium.config';
import { createLogger } from '../../../utils/logger';
import { DisposalRegistry } from '../../../utils/dispose';
import { eventBus } from '../../../hooks/use-event-bus';

const log = createLogger('CameraController');

/**
 * Controls camera behavior including fly-to, orbit, reset, auto-rotate, and keyboard navigation.
 */
export class CameraController {
  private viewer: Viewer | null = null;
  private autoRotateEnabled = false;
  private autoRotateHandle: number | null = null;
  private readonly disposal = new DisposalRegistry();

  /**
   * Initializes camera controls on the provided Viewer.
   *
   * @param viewer - CesiumJS Viewer instance
   */
  init(viewer: Viewer): void {
    this.viewer = viewer;

    this.setupKeyboardNavigation();
    this.setupDoubleClickFlyTo();
    this.setupEventListeners();

    log.info('Camera controller initialized');
  }

  /**
   * Smoothly flies the camera to a geographic location.
   *
   * @param longitude - Degrees
   * @param latitude - Degrees
   * @param altitude - Meters above ground (default: 50km)
   * @param duration - Animation duration in seconds
   */
  flyTo(
    longitude: number,
    latitude: number,
    altitude: number = FLY_TO_DEFAULTS.searchZoomHeight,
    duration: number = FLY_TO_DEFAULTS.duration,
  ): void {
    if (!this.viewer) return;

    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(longitude, latitude, altitude),
      duration,
      easingFunction: (time: number) => {
        // Smooth ease-in-out (cubic)
        return time < 0.5
          ? 4 * time * time * time
          : 1 - Math.pow(-2 * time + 2, 3) / 2;
      },
    });

    log.info(`Flying to: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
  }

  /**
   * Resets the camera to the default home view.
   */
  resetView(): void {
    if (!this.viewer) return;

    this.viewer.camera.flyTo({
      destination: Cartesian3.fromDegrees(
        DEFAULT_CAMERA.longitude,
        DEFAULT_CAMERA.latitude,
        DEFAULT_CAMERA.height,
      ),
      duration: FLY_TO_DEFAULTS.duration,
    });

    log.info('Camera reset to home view');
  }

  /**
   * Toggles auto-rotation around the globe.
   *
   * @param enabled - Whether to enable auto-rotation
   */
  setAutoRotate(enabled: boolean): void {
    this.autoRotateEnabled = enabled;

    if (enabled) {
      this.startAutoRotate();
    } else {
      this.stopAutoRotate();
    }
  }

  /**
   * Returns whether auto-rotate is currently active.
   */
  isAutoRotating(): boolean {
    return this.autoRotateEnabled;
  }

  /**
   * Sets up WASD/arrow key navigation for the camera.
   */
  private setupKeyboardNavigation(): void {
    const keysDown = new Set<string>();

    const onKeyDown = (e: KeyboardEvent) => {
      keysDown.add(e.key.toLowerCase());
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    this.disposal.registerFn(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    });

    // Per-frame keyboard camera update
    const tick = () => {
      if (!this.viewer || this.viewer.isDestroyed()) return;

      const camera = this.viewer.camera;
      const moveRate = camera.positionCartographic.height / 50;
      const rotateRate = 0.01;

      if (keysDown.has('arrowup') || keysDown.has('w')) {
        camera.moveForward(moveRate);
      }
      if (keysDown.has('arrowdown') || keysDown.has('s')) {
        camera.moveBackward(moveRate);
      }
      if (keysDown.has('arrowleft') || keysDown.has('a')) {
        camera.moveLeft(moveRate);
      }
      if (keysDown.has('arrowright') || keysDown.has('d')) {
        camera.moveRight(moveRate);
      }
      if (keysDown.has('+') || keysDown.has('=')) {
        camera.moveForward(moveRate * 2);
      }
      if (keysDown.has('-') || keysDown.has('_')) {
        camera.moveBackward(moveRate * 2);
      }
      if (keysDown.has('q')) {
        camera.twistLeft(rotateRate);
      }
      if (keysDown.has('e')) {
        camera.twistRight(rotateRate);
      }

      this.keyboardAnimationFrame = requestAnimationFrame(tick);
    };

    this.keyboardAnimationFrame = requestAnimationFrame(tick);
    this.disposal.registerFn(() => {
      if (this.keyboardAnimationFrame !== null) {
        cancelAnimationFrame(this.keyboardAnimationFrame);
      }
    });
  }

  private keyboardAnimationFrame: number | null = null;

  /**
   * Sets up double-click fly-to on the globe surface.
   */
  private setupDoubleClickFlyTo(): void {
    if (!this.viewer) return;

    const handler = new ScreenSpaceEventHandler(this.viewer.scene.canvas);

    handler.setInputAction(
      (click: { position: Cartesian2 }) => {
        if (!this.viewer) return;

        const cartesian = this.viewer.scene.pickPosition(click.position);
        if (defined(cartesian)) {
          const cartographic = Cartographic.fromCartesian(
            cartesian,
            Ellipsoid.WGS84,
          );
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lng = CesiumMath.toDegrees(cartographic.longitude);

          // Fly to the clicked location at a moderate altitude
          const currentHeight = this.viewer.camera.positionCartographic.height;
          const targetHeight = Math.max(currentHeight * 0.3, CAMERA_LIMITS.minimumZoomDistance * 10);

          this.flyTo(lng, lat, targetHeight, 2.0);
        }
      },
      ScreenSpaceEventType.LEFT_DOUBLE_CLICK,
    );

    this.disposal.registerFn(() => {
      if (!handler.isDestroyed()) handler.destroy();
    });
  }

  /**
   * Listens for event bus commands.
   */
  private setupEventListeners(): void {
    const unsub1 = eventBus.on('camera:flyTo', ({ lat, lng, altitude }) => {
      this.flyTo(lng, lat, altitude ?? FLY_TO_DEFAULTS.searchZoomHeight);
    });

    const unsub2 = eventBus.on('camera:reset', () => {
      this.resetView();
    });

    this.disposal.registerFn(unsub1);
    this.disposal.registerFn(unsub2);
  }

  /**
   * Starts the auto-rotation animation loop.
   */
  private startAutoRotate(): void {
    if (this.autoRotateHandle !== null) return;

    const rotate = () => {
      if (!this.autoRotateEnabled || !this.viewer || this.viewer.isDestroyed()) {
        this.autoRotateHandle = null;
        return;
      }

      this.viewer.scene.camera.rotateRight(0.002);
      this.autoRotateHandle = requestAnimationFrame(rotate);
    };

    this.autoRotateHandle = requestAnimationFrame(rotate);
    log.info('Auto-rotate started');
  }

  /**
   * Stops the auto-rotation animation loop.
   */
  private stopAutoRotate(): void {
    if (this.autoRotateHandle !== null) {
      cancelAnimationFrame(this.autoRotateHandle);
      this.autoRotateHandle = null;
    }
    log.info('Auto-rotate stopped');
  }

  /**
   * Cleans up all camera event handlers and animation loops.
   */
  dispose(): void {
    this.stopAutoRotate();
    this.disposal.disposeAll();
    this.viewer = null;
    log.info('Camera controller disposed');
  }
}
