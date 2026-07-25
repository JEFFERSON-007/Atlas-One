/**
 * Layer system interfaces and types.
 * Defines the contract that all layers must implement.
 */

import type { Viewer } from 'cesium';

/** Unique identifier for a layer. */
export type LayerId = string;

/** Category for grouping layers in the UI. */
export enum LayerCategory {
  Base = 'base',
  Overlay = 'overlay',
  Data = 'data',
  Reference = 'reference',
}

/** Metadata describing a layer for UI display. */
export interface LayerMetadata {
  /** Unique identifier. */
  id: LayerId;
  /** Display name. */
  name: string;
  /** Layer category for UI grouping. */
  category: LayerCategory;
  /** SVG icon string or emoji for the toggle button. */
  icon: string;
  /** Short description of what the layer shows. */
  description: string;
  /** Whether the layer is enabled by default. */
  defaultEnabled: boolean;
}

/**
 * Interface that all layers must implement.
 * Follows the Open-Closed Principle — new layers extend this interface
 * without modifying the registry or existing layers.
 */
export interface ILayer {
  /** Layer metadata for registration and UI display. */
  readonly metadata: LayerMetadata;

  /** Whether the layer is currently enabled. */
  isEnabled(): boolean;

  /**
   * Initializes the layer on the viewer.
   * Called once when the layer is first registered.
   */
  init(viewer: Viewer): Promise<void> | void;

  /**
   * Enables the layer (makes it visible).
   */
  enable(): void;

  /**
   * Disables the layer (hides it).
   */
  disable(): void;

  /**
   * Toggles the layer on/off.
   * @returns The new enabled state.
   */
  toggle(): boolean;

  /**
   * Cleans up layer resources.
   */
  dispose(): void;
}
