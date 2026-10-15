import { CallingCards, Camos, Operators, Reticles, type Cosmetics } from '../game/cosmetics.js';
import { SectionTitle } from './menu-widgets.js';
import { PlayerCard } from './player-card.js';
import styles from './menu.module.css';

/** Props for {@link CosmeticsTab}. */
export interface CosmeticsTabProps {
  cosmetics: Cosmetics;
  onCosmetics: (c: Cosmetics) => void;
}

/**
 * Personalisation: operator skin, weapon camo, reticle color, calling card and callsign.
 * Everything here is visual only.
 * @param props cosmetics tab props
 * @returns cosmetics tab
 */
export function CosmeticsTab({ cosmetics, onCosmetics }: CosmeticsTabProps) {
  const set = (patch: Partial<Cosmetics>) => onCosmetics({ ...cosmetics, ...patch });

  return (
    <div className={styles.cosmetics}>
      <section className={styles.cosmeticsMain}>
        <SectionTitle>OPERATOR</SectionTitle>
        <div className={styles.operatorGrid}>
          {Operators.map((o) => (
            <button
              key={o.id}
              className={cosmetics.operator === o.id ? styles.operatorActive : styles.operator}
              style={{ ['--accent' as string]: o.accent }}
              onClick={() => set({ operator: o.id })}
              aria-pressed={cosmetics.operator === o.id}
            >
              <span className={styles.operatorPortrait}>
                <span className={styles.operatorHead} />
                <span className={styles.operatorBody} style={{ background: `#${o.sleeve.toString(16).padStart(6, '0')}` }} />
              </span>
              <span className={styles.cardName}>{o.name}</span>
              <span className={styles.cardClass}>{o.faction}</span>
            </button>
          ))}
        </div>

        <SectionTitle>WEAPON CAMO</SectionTitle>
        <div className={styles.camoGrid}>
          {Camos.map((c) => (
            <button
              key={c.id}
              className={cosmetics.camo === c.id ? styles.camoActive : styles.camo}
              onClick={() => set({ camo: c.id })}
              aria-pressed={cosmetics.camo === c.id}
              title={c.name}
            >
              <span className={styles.camoSwatch} style={{ background: c.swatch }} />
              <span className={styles.camoName}>{c.name}</span>
              <span className={`${styles.tier} ${styles[`tier${c.tier}`]}`}>{c.tier}</span>
            </button>
          ))}
        </div>

        <SectionTitle>RETICLE COLOR</SectionTitle>
        <div className={styles.reticleRow}>
          {Reticles.map((r) => (
            <button
              key={r.id}
              className={cosmetics.reticle === r.id ? styles.reticleActive : styles.reticle}
              onClick={() => set({ reticle: r.id })}
              aria-label={`${r.name} reticle`}
              aria-pressed={cosmetics.reticle === r.id}
            >
              <span className={styles.reticleIcon} style={{ ['--reticle' as string]: r.color }} />
            </button>
          ))}
        </div>

        <SectionTitle>CALLING CARD</SectionTitle>
        <div className={styles.cardGrid}>
          {CallingCards.map((c) => (
            <button
              key={c.id}
              className={cosmetics.callingCard === c.id ? styles.callingActive : styles.calling}
              style={{ background: c.background }}
              onClick={() => set({ callingCard: c.id })}
              aria-pressed={cosmetics.callingCard === c.id}
            >
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      <aside className={styles.cosmeticsPreview}>
        <SectionTitle>PLAYER CARD</SectionTitle>
        <PlayerCard cosmetics={cosmetics} large />
        <label className={styles.callsignField}>
          <span className={styles.slotLabel}>CALLSIGN</span>
          <input
            value={cosmetics.callsign}
            maxLength={16}
            onChange={(e) => set({ callsign: e.target.value.toUpperCase().replace(/[^A-Z0-9_\- ]/g, '') })}
            placeholder="OPERATOR"
          />
        </label>
        <div className={styles.statMeta}>Cosmetics are visual only and apply on your next deploy.</div>
      </aside>
    </div>
  );
}
