import { Perks, Weapons, type GameSettings, type Loadout } from '../game/config.js';
import { Camos, findCosmetic, type Cosmetics } from '../game/cosmetics.js';
import { Maps, findMap } from '../game/maps/index.js';
import harborImg from '../assets/maps/harbor.png';
import downtownImg from '../assets/maps/downtown.png';
import outpostImg from '../assets/maps/outpost.png';
import shootHouseImg from '../assets/maps/shoot-house.png';
import { SectionTitle } from './menu-widgets.js';
import styles from './menu.module.css';

/** A playlist entry on the Deploy tab — a bot-count preset for the next match. */
interface Playlist {
  id: string;
  name: string;
  tag: string;
  desc: string;
  bots: number;
}

/** Preview art per map id. */
const MAP_ART: Record<string, string> = {
  'shoot-house': shootHouseImg,
  downtown: downtownImg,
  harbor: harborImg,
  outpost: outpostImg,
};

const PLAYLISTS: Playlist[] = [
  { id: 'skirmish', name: 'SKIRMISH', tag: 'WARM-UP', desc: 'A handful of bots. Learn the map, test your loadout.', bots: 3 },
  { id: 'resurgence', name: 'RESURGENCE', tag: 'FAST-PACED', desc: 'Mid-size lobby with constant pressure.', bots: 6 },
  { id: 'battle-royale', name: 'BATTLE ROYALE', tag: 'FEATURED', desc: 'Full lobby. Every bot is hunting you.', bots: 12 },
];

/** Props for {@link DeployTab}. */
export interface DeployTabProps {
  loadout: Loadout;
  settings: GameSettings;
  cosmetics: Cosmetics;
  onSettings: (s: GameSettings) => void;
  /** Jump to the Armory to edit the loadout. */
  onEditLoadout: () => void;
}

/**
 * Lobby screen: pick a playlist (bot preset) and review the active loadout before deploying.
 * @param props deploy tab props
 * @returns deploy tab
 */
export function DeployTab({ loadout, settings, cosmetics, onSettings, onEditLoadout }: DeployTabProps) {
  const camo = findCosmetic(Camos, cosmetics.camo);
  const perkNames = loadout.perks.map((id) => Perks.find((p) => p.id === id)?.name ?? id);
  const activeId = PLAYLISTS.find((p) => p.bots === settings.botCount)?.id;
  const activeMap = findMap(settings.mapId);

  return (
    <div className={styles.deployLayout}>
      <section>
        <SectionTitle>SELECT MAP</SectionTitle>
        <div className={styles.maps}>
          {Maps.map((m) => {
            const active = m.id === activeMap.id;
            return (
              <button
                key={m.id}
                className={active ? styles.mapCardActive : styles.mapCard}
                onClick={() => onSettings({ ...settings, mapId: m.id, botCount: Math.max(settings.botCount, m.recommendedBots) })}
                aria-pressed={active}
              >
                <img className={styles.mapArt} src={MAP_ART[m.id]} alt="" loading="lazy" />
                <span className={styles.mapInfo}>
                  <span className={styles.playlistTag}>
                    {m.size} · {m.half * 2}×{m.half * 2}
                  </span>
                  <span className={styles.playlistName}>{m.name}</span>
                  <span className={styles.playlistDesc}>{m.desc}</span>
                </span>
              </button>
            );
          })}
        </div>

        <SectionTitle>SELECT PLAYLIST</SectionTitle>
        <div className={styles.playlists}>
          {PLAYLISTS.map((p) => (
            <button
              key={p.id}
              className={activeId === p.id ? styles.playlistActive : styles.playlist}
              onClick={() => onSettings({ ...settings, botCount: p.bots })}
              aria-pressed={activeId === p.id}
            >
              <span className={styles.playlistTag}>{p.tag}</span>
              <span className={styles.playlistName}>{p.name}</span>
              <span className={styles.playlistDesc}>{p.desc}</span>
              <span className={styles.playlistBots}>
                <b>{p.bots}</b> HOSTILES
              </span>
            </button>
          ))}
        </div>
        {!activeId && <div className={styles.note}>Custom lobby · {settings.botCount} hostiles (set in Settings)</div>}
      </section>

      <aside className={styles.loadoutSummary}>
        <SectionTitle
          aside={
            <button className={styles.linkBtn} onClick={onEditLoadout}>
              EDIT ›
            </button>
          }
        >
          ACTIVE LOADOUT
        </SectionTitle>
        <div className={styles.summarySlot}>
          <span className={styles.slotLabel}>PRIMARY</span>
          <span className={styles.slotName}>{loadout.primary}</span>
          <span className={styles.slotMeta}>
            {Weapons[loadout.primary]?.cls} · <i className={styles.camoDot} style={{ background: camo.swatch }} /> {camo.name}
          </span>
        </div>
        <div className={styles.summarySlot}>
          <span className={styles.slotLabel}>SECONDARY</span>
          <span className={styles.slotName}>{loadout.secondary}</span>
          <span className={styles.slotMeta}>{Weapons[loadout.secondary]?.cls}</span>
        </div>
        <div className={styles.summaryPerks}>
          {perkNames.map((n, i) => (
            <span key={n} className={`${styles.perkChip} ${styles[`perk${i}`]}`}>
              {n}
            </span>
          ))}
        </div>
        <div className={styles.slotMeta}>
          Lethal: Frag ×{loadout.perks.includes('Shrapnel') ? 3 : 2} · Tactical: Flashbang ×2 · Plates ×2
        </div>
      </aside>
    </div>
  );
}
