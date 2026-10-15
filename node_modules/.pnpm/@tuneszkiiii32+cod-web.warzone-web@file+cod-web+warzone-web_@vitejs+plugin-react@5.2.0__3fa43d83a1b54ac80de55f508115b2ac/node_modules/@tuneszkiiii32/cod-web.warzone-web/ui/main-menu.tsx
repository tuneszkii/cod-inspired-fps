import { useEffect, useState } from 'react';
import type { GameSettings, Loadout } from '../game/config.js';
import type { Cosmetics } from '../game/cosmetics.js';
import lobbyBg from '../assets/lobby-bg.png';
import { ArmoryTab } from './armory-tab.js';
import { CosmeticsTab } from './cosmetics-tab.js';
import { DeployTab } from './deploy-tab.js';
import { PlayerCard } from './player-card.js';
import { SettingsTab } from './settings-tab.js';
import styles from './menu.module.css';

/** Menu tabs, in top-bar order. */
export type MenuTab = 'deploy' | 'armory' | 'cosmetics' | 'settings';

const TABS: { id: MenuTab; label: string; key: string }[] = [
  { id: 'deploy', label: 'DEPLOY', key: '1' },
  { id: 'armory', label: 'ARMORY', key: '2' },
  { id: 'cosmetics', label: 'COSMETICS', key: '3' },
  { id: 'settings', label: 'SETTINGS', key: '4' },
];

/** Props for {@link MainMenu}. */
export interface MainMenuProps {
  loadout: Loadout;
  settings: GameSettings;
  cosmetics: Cosmetics;
  onLoadout: (l: Loadout) => void;
  onSettings: (s: GameSettings) => void;
  onCosmetics: (c: Cosmetics) => void;
  onDeploy: () => void;
  /** Label for the main button ("DEPLOY" or "RESUME"). */
  deployLabel?: string;
  /** Shown while paused: lets the player quit back to the menu. */
  onQuit?: () => void;
  /** Error message shown above the deploy button (e.g. WebGL unavailable). */
  error?: string | null;
  /** Tab to open first. */
  initialTab?: MenuTab;
}

/**
 * Warzone-style main / pause menu with Deploy, Armory, Cosmetics and Settings tabs.
 * Keys 1–4 (or Q / E) switch tabs.
 * @param props menu props
 * @returns menu screen
 */
export function MainMenu({
  loadout, settings, cosmetics, onLoadout, onSettings, onCosmetics, onDeploy, deployLabel = 'DEPLOY', onQuit, error, initialTab = 'deploy',
}: MainMenuProps) {
  const [tab, setTab] = useState<MenuTab>(initialTab);
  const paused = !!onQuit;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'text') return;
      const idx = TABS.findIndex((t) => t.id === tab);
      const byKey = TABS.find((t) => t.key === e.key);
      if (byKey) setTab(byKey.id);
      else if (e.key === 'q' || e.key === 'Q') setTab(TABS[(idx + TABS.length - 1) % TABS.length].id);
      else if (e.key === 'e' || e.key === 'E') setTab(TABS[(idx + 1) % TABS.length].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab]);

  return (
    <div className={styles.menu} style={{ ['--bg' as string]: `url(${lobbyBg})` }}>
      <div className={styles.backdrop} aria-hidden />
      <div className={styles.inner}>
        <header className={styles.topbar}>
          <div className={styles.brand}>
            <span className={styles.kicker}>{paused ? 'MATCH IN PROGRESS' : 'MODERN WARFARE · WEB'}</span>
            <span className={styles.title}>
              WARZONE<span>.WEB</span>
            </span>
          </div>
          <nav className={styles.tabs} role="tablist">
            <span className={styles.tabKey} aria-hidden>Q</span>
            {TABS.map((t) => (
              <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? styles.tabActive : styles.tab} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            <span className={styles.tabKey} aria-hidden>E</span>
          </nav>
          <PlayerCard cosmetics={cosmetics} />
        </header>

        <main className={styles.content} key={tab}>
          {tab === 'deploy' && (
            <DeployTab loadout={loadout} settings={settings} cosmetics={cosmetics} onSettings={onSettings} onEditLoadout={() => setTab('armory')} />
          )}
          {tab === 'armory' && <ArmoryTab loadout={loadout} onLoadout={onLoadout} />}
          {tab === 'cosmetics' && <CosmeticsTab cosmetics={cosmetics} onCosmetics={onCosmetics} />}
          {tab === 'settings' && <SettingsTab settings={settings} onSettings={onSettings} />}
        </main>

        <footer className={styles.footer}>
          {error && (
            <div role="alert" className={styles.error}>
              {error}
            </div>
          )}
          <div className={styles.footerActions}>
            {onQuit && (
              <button className={styles.secondary} onClick={onQuit}>
                QUIT MATCH
              </button>
            )}
            <button className={styles.deploy} onClick={onDeploy}>
              <span className={styles.deployLabel}>{deployLabel}</span>
              <span className={styles.deploySub}>{paused ? 'BACK TO THE FIGHT' : `${settings.botCount} HOSTILES · ${loadout.primary}`}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
