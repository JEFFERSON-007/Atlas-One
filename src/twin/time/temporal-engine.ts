/**
 * Temporal Engine — Centralized master clock and time controller for Atlas One v0.7.
 * Manages REAL_TIME, HISTORICAL, and SIMULATION modes.
 */

import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';
import { TemporalMode, TemporalState, PlaybackSpeed, TimeRange } from './temporal-state.types';

const log = createLogger('TemporalEngine');

export class TemporalEngine {
  private state: TemporalState;
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    const now = new Date();
    // Default start/end to -/+ 1 year from now for boundary purposes.
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date(now);
    end.setFullYear(end.getFullYear() + 1);

    this.state = {
      mode: TemporalMode.REAL_TIME,
      currentTime: new Date(now),
      startTime: start,
      endTime: end,
      isPlaying: true, // Playing means advancing time
      playbackSpeed: 1,
      loop: false,
    };
  }

  init(): void {
    this.startClock();
    log.info('Temporal Engine initialized in REAL_TIME mode');
  }

  /** Starts internal clock loop. */
  private startClock(): void {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (!this.state.isPlaying && this.state.mode !== TemporalMode.REAL_TIME) {
        return;
      }

      if (this.state.mode === TemporalMode.REAL_TIME) {
        if (!this.state.isPlaying) return; // If paused in realtime, it just freezes.
        this.state.currentTime = new Date();
      } else {
        // Advance simulation/historical time by 1 sec * multiplier
        const deltaMs = 1000 * this.state.playbackSpeed;
        const newTime = new Date(this.state.currentTime.getTime() + deltaMs);

        // Boundary check
        if (this.state.selectedRange) {
          if (newTime > this.state.selectedRange.end) {
            if (this.state.loop) {
              this.state.currentTime = new Date(this.state.selectedRange.start);
            } else {
              this.state.currentTime = new Date(this.state.selectedRange.end);
              this.state.isPlaying = false;
            }
          } else if (newTime < this.state.selectedRange.start) {
            if (this.state.loop) {
              this.state.currentTime = new Date(this.state.selectedRange.end);
            } else {
              this.state.currentTime = new Date(this.state.selectedRange.start);
              this.state.isPlaying = false;
            }
          } else {
            this.state.currentTime = newTime;
          }
        } else {
          // Default boundaries
          if (newTime > this.state.endTime) {
            if (this.state.loop) {
              this.state.currentTime = new Date(this.state.startTime);
            } else {
              this.state.currentTime = new Date(this.state.endTime);
              this.state.isPlaying = false;
            }
          } else {
            this.state.currentTime = newTime;
          }
        }
      }

      this.emitUpdate();
    }, 1000); // Ticks every real second.
  }

  private emitUpdate(): void {
    eventBus.emit('time:updated', this.state);
  }

  /** Toggles pause state. */
  togglePause(): boolean {
    this.state.isPlaying = !this.state.isPlaying;
    log.info(`Playback playing: ${this.state.isPlaying}`);
    this.emitUpdate();
    return this.state.isPlaying;
  }

  /** Sets pause state. */
  setPaused(paused: boolean): void {
    this.state.isPlaying = !paused;
    this.emitUpdate();
  }

  /** Sets the simulation time directly. */
  setTime(date: Date): void {
    this.state.currentTime = new Date(date);
    
    // Switch to HISTORICAL mode if setting a past date and we are in REAL_TIME
    if (this.state.mode === TemporalMode.REAL_TIME) {
      const now = new Date();
      // If setting to a time more than 5 minutes in the past
      if (now.getTime() - date.getTime() > 5 * 60 * 1000) {
        this.state.mode = TemporalMode.HISTORICAL;
        this.state.isPlaying = false;
      }
    }
    
    log.info(`Time set to ${this.state.currentTime.toISOString()} (${this.state.mode})`);
    this.emitUpdate();
  }

  /** Sets the temporal mode */
  setMode(mode: TemporalMode): void {
    this.state.mode = mode;
    if (mode === TemporalMode.REAL_TIME) {
      this.state.playbackSpeed = 1;
      this.state.currentTime = new Date();
      this.state.isPlaying = true;
    }
    log.info(`Switched to mode: ${mode}`);
    this.emitUpdate();
  }

  /** Sets custom playback speed. */
  setSpeed(speed: PlaybackSpeed): void {
    this.state.playbackSpeed = speed;
    if (this.state.mode === TemporalMode.REAL_TIME && speed !== 1) {
      this.setMode(TemporalMode.SIMULATION);
    }
    log.info(`Playback speed set to ${speed}x`);
    this.emitUpdate();
  }

  /** Step forward or back by seconds. */
  step(seconds: number): Date {
    if (this.state.mode === TemporalMode.REAL_TIME) {
      this.setMode(TemporalMode.HISTORICAL);
      this.state.isPlaying = false;
    }
    this.state.currentTime = new Date(this.state.currentTime.getTime() + seconds * 1000);
    this.emitUpdate();
    return this.state.currentTime;
  }
  
  /** Sets a specific playback range (for bounding historical playback) */
  setRange(range: TimeRange | undefined): void {
    this.state.selectedRange = range;
    if (range) {
      if (this.state.currentTime < range.start) this.state.currentTime = new Date(range.start);
      if (this.state.currentTime > range.end) this.state.currentTime = new Date(range.end);
    }
    this.emitUpdate();
  }

  /** Sets looping behavior */
  setLoop(loop: boolean): void {
    this.state.loop = loop;
    this.emitUpdate();
  }

  /** Returns current time. */
  getCurrentTime(): Date {
    return new Date(this.state.currentTime);
  }

  /** Returns full temporal state. */
  getState(): TemporalState {
    return { ...this.state, currentTime: new Date(this.state.currentTime) };
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    log.info('Temporal Engine disposed');
  }
}
