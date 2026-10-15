import { useState } from 'react';
import { DefaultSettings, type GameSettings } from '../game/config.js';
import { GraphicsPresets, PresetOrder, detectPreset, estimateLoad, type GraphicsSettings, type PresetId, type ShadowQuality } from '../game/graphics.js';
import { Segmented, SectionTitle, Slider, Toggle } from './menu-widgets.js';
import styles from './menu.module.css';

const CONTROLS: [string, string][] = [
  ['WASD / Arrows', 'Move'], ['Touch', 'Left stick move · drag right side to look'], ['Mouse', 'Look'], ['LMB', 'Fire'], ['RMB', 'Aim down sights'], ['R', 'Reload'],
  ['1 / 2 · Wheel · F', 'Switch weapon'], ['Shift', 'Sprint (double-tap = tactical)'], ['C / Ctrl', 'Crouch · slide while sprinting'],
  ['Space', 'Jump (slide-hop)'], ['G (hold)', 'Frag — hold to cook'], ['Q', 'Flashbang'], ['V', 'Quick melee'], ['3', 'Equip knife · LMB slash · RMB lunge stab'],
  ['E', 'Pick up weapon'], ['X', 'Armor plate'], ['T', 'Use killstreak reward'], ['Shift (scoped)', 'Hold breath'], ['Tab', 'Scoreboard'], ['Esc', 'Pause'],
];

type Section = 'graphics' | 'mouse' | 'gameplay' | 'audio' | 'controls';

const SHADOW_OPTIONS: { value: ShadowQuality; label: string }[] = [
  { value: 'off', label: 'OFF' },
  { value: 'low', label: 'LOW' },
  { value: 'high', label: 'HIGH' },
  { value: 'ultra', label: 'ULTRA' },
];
const FPS_CAPS: { value: string; label: string }[] = [
  { value: '30', label: '30' },
  { value: '60', label: '60' },
  { value: '120', label: '120' },
  { value: '0', label: 'UNLIMITED' },
];

/** Props for {@link SettingsTab}. */
export interface SettingsTabProps {
  settings: GameSettings;
  onSettings: (s: GameSettings) => void;
}

/**
 * Settings with a left section rail (Mouse, Gameplay, Audio, Controls), like the Warzone options menu.
 * @param props settings props
 * @returns settings tab
 */
export function SettingsTab({ settings, onSettings }: SettingsTabProps) {
  const [section, setSection] = useState<Section>('graphics');
  const set = (patch: Partial<GameSettings>) => onSettings({ ...settings, ...patch });
  const g = settings.graphics;
  const setG = (patch: Partial<GraphicsSettings>) => set({ graphics: { ...g, ...patch } });
  const preset = detectPreset(g);
  const load = estimateLoad(g);
  const sections: [Section, string][] = [['graphics', 'GRAPHICS'], ['mouse', 'MOUSE & AIM'], ['gameplay', 'GAMEPLAY'], ['audio', 'AUDIO'], ['controls', 'CONTROLS']];

  return (
    <div className={styles.settingsLayout}>
      <nav className={styles.settingsRail}>
        {sections.map(([id, label]) => (
          <button key={id} className={section === id ? styles.railActive : styles.rail} onClick={() => setSection(id)}>
            {label}
          </button>
        ))}
        <button className={styles.resetBtn} onClick={() => onSettings(DefaultSettings)}>
          RESET TO DEFAULT
        </button>
      </nav>

      <section className={styles.settingsPanel}>
        {section === 'graphics' && (
          <>
            <SectionTitle>GRAPHICS</SectionTitle>
            <Segmented<PresetId>
              label="Quality preset"
              hint={preset ? 'Sets resolution, shadows, view distance and anti-aliasing' : 'Custom — you changed an option below'}
              options={PresetOrder.map((id) => ({ value: id, label: id.toUpperCase() }))}
              value={preset}
              onChange={(id) => setG(GraphicsPresets[id])}
            />
            <div className={styles.loadMeter} aria-label={`Estimated GPU load ${Math.round(load * 100)}%`}>
              <span className={styles.slotLabel}>EST. GPU LOAD</span>
              <div className={styles.loadTrack}>
                <div style={{ width: `${load * 100}%`, background: load > 0.75 ? '#ff6b5e' : load > 0.5 ? 'var(--amber)' : 'var(--accent)' }} />
              </div>
              <b>{load > 0.75 ? 'HEAVY' : load > 0.5 ? 'MODERATE' : 'LIGHT'}</b>
            </div>
            <Slider label="Render resolution" hint="Below 100% is faster, above sharpens the image" min={0.5} max={1.5} step={0.05} value={g.renderScale} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => setG({ renderScale: v })} />
            <Segmented<ShadowQuality> label="Shadows" hint="Biggest FPS cost after resolution" options={SHADOW_OPTIONS} value={g.shadows} onChange={(v) => setG({ shadows: v })} />
            <Slider label="View distance" hint="How far you see before fog hides the world" min={150} max={600} step={10} value={g.viewDistance} fmt={(v) => `${v}`} onChange={(v) => setG({ viewDistance: v })} />
            <Toggle label="Anti-aliasing" hint="Smooths jagged edges · applies on next deploy" checked={g.antialias} onChange={(v) => setG({ antialias: v })} />
            <Segmented<string> label="FPS limit" hint="Cap to save battery and heat" options={FPS_CAPS} value={String(g.fpsCap)} onChange={(v) => setG({ fpsCap: Number(v) })} />
            <Toggle label="FPS counter" hint="Show frames per second in-game" checked={g.showFps} onChange={(v) => setG({ showFps: v })} />
          </>
        )}
        {section === 'mouse' && (
          <>
            <SectionTitle>MOUSE & AIM</SectionTitle>
            <Slider label="Sensitivity" hint="Hip-fire look speed" min={0.2} max={3} step={0.05} value={settings.sensitivity} fmt={(v) => v.toFixed(2)} onChange={(v) => set({ sensitivity: v })} />
            <Slider label="ADS sensitivity" hint="Look speed while aiming" min={0.2} max={3} step={0.05} value={settings.adsSensitivity} fmt={(v) => v.toFixed(2)} onChange={(v) => set({ adsSensitivity: v })} />
          </>
        )}
        {section === 'gameplay' && (
          <>
            <SectionTitle>GAMEPLAY</SectionTitle>
            <Slider label="Field of view" hint="Wider shows more, narrower zooms in" min={60} max={110} step={1} value={settings.fov} fmt={(v) => `${v}°`} onChange={(v) => set({ fov: v })} />
            <Slider label="Hostiles" hint="Bots in your next match" min={1} max={20} step={1} value={settings.botCount} fmt={(v) => `${v}`} onChange={(v) => set({ botCount: v })} />
          </>
        )}
        {section === 'audio' && (
          <>
            <SectionTitle>AUDIO</SectionTitle>
            <Slider label="Master volume" min={0} max={1} step={0.05} value={settings.volume} fmt={(v) => `${Math.round(v * 100)}%`} onChange={(v) => set({ volume: v })} />
          </>
        )}
        {section === 'controls' && (
          <>
            <SectionTitle>KEYBINDS</SectionTitle>
            <div className={styles.controls}>
              {CONTROLS.map(([k, a]) => (
                <div key={k} className={styles.controlRow}>
                  <kbd>{k}</kbd>
                  <span>{a}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
