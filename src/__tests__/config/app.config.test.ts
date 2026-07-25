import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('AppConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should export loadAppConfig function', async () => {
    const { loadAppConfig } = await import('../../config/app.config');
    expect(typeof loadAppConfig).toBe('function');
  });

  it('should return a valid config object', async () => {
    const { loadAppConfig } = await import('../../config/app.config');
    const config = loadAppConfig();

    expect(config).toHaveProperty('cesiumIonToken');
    expect(config).toHaveProperty('hasCesiumIon');
    expect(config).toHaveProperty('performanceTier');
    expect(config).toHaveProperty('graphicsQuality');
    expect(config).toHaveProperty('isProduction');
    expect(config).toHaveProperty('basePath');
  });

  it('should detect missing Ion token', async () => {
    const { loadAppConfig } = await import('../../config/app.config');
    const config = loadAppConfig();

    // In test environment, no .env is loaded
    expect(config.hasCesiumIon).toBe(false);
    expect(config.cesiumIonToken).toBe('');
  });

  it('should filter placeholder token values', async () => {
    const { loadAppConfig } = await import('../../config/app.config');
    const config = loadAppConfig();

    // YOUR_CESIUM_ION_TOKEN should be treated as empty
    expect(config.cesiumIonToken).toBe('');
  });
});
