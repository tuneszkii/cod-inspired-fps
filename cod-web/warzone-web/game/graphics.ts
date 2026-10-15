/** Shadow quality levels (shadow-map resolution). */
export type ShadowQuality = 'off' | 'low' | 'high' | 'ultra';

/** Shadow-map size in pixels per quality level (0 = shadows disabled). */
export const ShadowMapSize: Record<ShadowQuality, number> = { off: 0, low: 1024, high: 2048, ultra: 4096 };

/** User-adjustable graphics options. */
export interface GraphicsSettings {
  /** Internal resolution multiplier (1 = native). Below 1 trades sharpness for FPS, above 1 supersamples. */
  renderScale: number;
  shadows: ShadowQuality;
  /** Fog end / camera far distance in studs. */
  viewDistance: number;
  /** Edge smoothing. Fixed when the renderer is created, so it applies from the next match. */
  antialias: boolean;
  /** Maximum frames per second (0 = unlimited). */
  fpsCap: number;
  showFps: boolean;
}

/** Named quality presets. */
export type PresetId = 'low' | 'medium' | 'high' | 'ultra';

/** The options a preset controls (FPS cap and counter are independent of presets). */
export type PresetValues = Pick<GraphicsSettings, 'renderScale' | 'shadows' | 'viewDistance' | 'antialias'>;

export const GraphicsPresets: Record<PresetId, PresetValues> = {
  low: { renderScale: 0.6, shadows: 'off', viewDistance: 200, antialias: false },
  medium: { renderScale: 0.8, shadows: 'low', viewDistance: 300, antialias: false },
  high: { renderScale: 1, shadows: 'high', viewDistance: 420, antialias: true },
  ultra: { renderScale: 1.25, shadows: 'ultra', viewDistance: 600, antialias: true },
};

export const PresetOrder: PresetId[] = ['low', 'medium', 'high', 'ultra'];

export const DefaultGraphics: GraphicsSettings = { ...GraphicsPresets.high, fpsCap: 0, showFps: true };

/**
 * Finds the preset that matches the current options, or `null` when they have been customised.
 * @param g graphics settings
 * @returns the matching preset id or null
 */
export function detectPreset(g: GraphicsSettings): PresetId | null {
  return (
    PresetOrder.find((id) => {
      const p = GraphicsPresets[id];
      return p.renderScale === g.renderScale && p.shadows === g.shadows && p.viewDistance === g.viewDistance && p.antialias === g.antialias;
    }) ?? null
  );
}

const SHADOW_COST: Record<ShadowQuality, number> = { off: 0, low: 0.08, high: 0.17, ultra: 0.3 };

/**
 * Rough estimate of GPU load (0..1) for the options, shown as a meter in the menu.
 * @param g graphics settings
 * @returns relative load, 1 = heaviest
 */
export function estimateLoad(g: GraphicsSettings): number {
  const load = 0.4 * (g.renderScale * g.renderScale) + SHADOW_COST[g.shadows] + 0.2 * ((g.viewDistance - 150) / 450) + (g.antialias ? 0.1 : 0);
  // 1.5 is the heaviest possible combination (150% scale, ultra shadows, max distance, AA)
  return Math.max(0.05, Math.min(1, load / 1.5));
}
