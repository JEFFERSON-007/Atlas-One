/**
 * TimeController — Centralized master clock and time controller for Atlas One.
 * Supports real-time mode, simulation playback speeds (0.25x to 100x), pause/play,
 * step forward/back, and clock synchronization.
 */

import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('TimeController');

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 2 | 5 | 10 | 50 | 100;

export class TimeController {
  private currentTime: Date = new Date();
  private isPaused = false;
  private isLive = true;
  private speedMultiplier: PlaybackSpeed = 1;
  private timer: ReturnType<typeof setInterval> | null = null;

  init(): void {
    this.startClock();
    log.info('Time Controller initialized in live mode');
  }

  /** Starts internal clock loop. */
  private startClock(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (this.isPaused) return;

      if (this.isLive) {
        this.currentTime = new Date();
      } else {
        // Advance simulation time by 1 sec * multiplier
        const deltaMs = 1000 * this.speedMultiplier;
        this.currentTime = new Date(this.currentTime.getTime() + deltaMs);
      }

      eventBus.emit('time:updated', {
        currentTime: this.currentTime,
        isPaused: this.isPaused,
        isLive: this.isLive,
        speedMultiplier: this.speedMultiplier,
      });
    }, 1000);
  }

  /** Toggles pause state. */
  togglePause(): boolean {
    this.isPaused = !this.isPaused;
    log.info(`Time paused: ${this.isPaused}`);
    return this.isPaused;
  }

  /** Sets pause state. */
  setPaused(paused: boolean): void {
    this.isPaused = paused;
  }

  /** Enables live real-time clock mode. */
  setLiveMode(): void {
    this.isLive = true;
    this.isPaused = false;
    this.speedMultiplier = 1;
    this.currentTime = new Date();
    log.info('Switched to Live time mode');
  }

  /** Sets custom simulation playback speed. */
  setSpeed(speed: PlaybackSpeed): void {
    this.speedMultiplier = speed;
    this.isLive = false;
    log.info(`Playback speed set to ${speed}x`);
  }

  /** Step forward or back by seconds. */
  step(seconds: number): Date {
    this.isLive = false;
    this.currentTime = new Date(this.currentTime.getTime() + seconds * 1000);
    return this.currentTime;
  }

  /** Returns current time. */
  getCurrentTime(): Date {
    return new Date(this.currentTime);
  }

  /** Returns current playback parameters. */
  getState(): {
    currentTime: Date;
    isPaused: boolean;
    isLive: boolean;
    speedMultiplier: PlaybackSpeed;
  } {
    return {
      currentTime: new Date(this.currentTime),
      isPaused: this.isPaused,
      isLive: this.isLive,
      speedMultiplier: this.speedMultiplier,
    };
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    log.info('Time Controller disposed');
  }
}
