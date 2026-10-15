import { useCallback, useEffect, useRef, useState } from 'react';
import { DefaultLoadout, DefaultSettings, Weapons, type GameSettings, type Loadout } from './game/config.js';
import { DefaultCosmetics, Reticles, findCosmetic, type Cosmetics } from './game/cosmetics.js';
import { usePersistedState } from './use-persisted-state.js';
import type { Game } from './game/game.js';
import type { HudState } from './game/hud-state.js';
import { Hud } from './ui/hud.js';
import { MainMenu } from './ui/main-menu.js';
import { TouchControls } from './ui/touch-controls.js';
import styles from './warzone-web.module.css';

type Phase = 'menu' | 'playing' | 'paused';

/**
 * Root of the browser port of the Roblox CoD MW2019-style FPS.
 * Owns the menu / pause flow and mounts the Three.js game (loaded lazily so SSR stays safe).
 * @returns the app
 */
export function WarzoneWeb() {
  const host = useRef<HTMLDivElement>(null);
  const game = useRef<Game | null>(null);
  const [phase, setPhase] = useState<Phase>('menu');
  const [hud, setHud] = useState<HudState | null>(null);
  const [savedLoadout, setLoadout] = usePersistedState<Loadout>('wzw.loadout', DefaultLoadout);
  // guard against stale saves that reference weapons that no longer exist
  const loadout = Weapons[savedLoadout.primary] && Weapons[savedLoadout.secondary] ? savedLoadout : DefaultLoadout;
  const [settings, setSettings] = usePersistedState<GameSettings>('wzw.settings', DefaultSettings);
  const [cosmetics, setCosmetics] = usePersistedState<Cosmetics>('wzw.cosmetics', DefaultCosmetics);
  const reticleColor = findCosmetic(Reticles, cosmetics.reticle).color;
  const [touch, setTouch] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Preloaded game module, so Deploy runs inside the click gesture (needed for pointer lock). */
  const gameModule = useRef<Promise<typeof import('./game/game.js')> | null>(null);

  useEffect(() => {
    gameModule.current = import('./game/game.js');
    import('./game/input.js').then((m) => setTouch(m.isTouchDevice())).catch(() => undefined);
  }, []);

  const quit = useCallback(() => {
    game.current?.dispose();
    game.current = null;
    setHud(null);
    setPhase('menu');
  }, []);

  useEffect(() => () => game.current?.dispose(), []);
  useEffect(() => game.current?.applySettings(settings), [settings]);

  const deploy = async () => {
    setError(null);
    if (game.current) {
      game.current.resume();
      setPhase('playing');
      return;
    }
    try {
      const { Game: GameClass } = await (gameModule.current ?? import('./game/game.js'));
      if (!host.current) return;
      const g = new GameClass(host.current, loadout, settings, setHud, (paused) => setPhase(paused ? 'paused' : 'playing'), cosmetics);
      game.current = g;
      g.start();
      setPhase('playing');
    } catch (e) {
      game.current?.dispose();
      game.current = null;
      setError(e instanceof Error ? e.message : 'Could not start the game on this device.');
    }
  };

  const pause = useCallback(() => {
    game.current?.pause();
  }, []);

  return (
    <div className={styles.root}>
      <div ref={host} className={styles.canvas} />
      {hud && phase !== 'menu' && <Hud s={hud} reticleColor={reticleColor} showFps={settings.graphics.showFps} />}
      {touch && phase === 'playing' && game.current && <TouchControls input={game.current.controls} onPause={pause} canPickup={!!hud?.pickupPrompt} knifeHeld={hud?.weaponClass === 'Melee'} hasStreak={!!hud?.streaks.length} />}
      {phase === 'menu' && (
        <MainMenu
          loadout={loadout}
          settings={settings}
          cosmetics={cosmetics}
          onLoadout={setLoadout}
          onSettings={setSettings}
          onCosmetics={setCosmetics}
          onDeploy={deploy}
          error={error}
        />
      )}
      {phase === 'paused' && (
        <MainMenu
          loadout={loadout}
          settings={settings}
          cosmetics={cosmetics}
          onLoadout={setLoadout}
          onSettings={setSettings}
          onCosmetics={setCosmetics}
          onDeploy={deploy}
          deployLabel="RESUME"
          onQuit={quit}
        />
      )}
    </div>
  );
}
