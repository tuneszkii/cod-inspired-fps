import { useState } from 'react';
import { ClassOrder, PerkSlotNames, Perks, Weapons, isPrimary, type Loadout, type PerkCfg, type WeaponCfg } from '../game/config.js';
import { SectionTitle, Stat } from './menu-widgets.js';
import styles from './menu.module.css';

/** Props for {@link ArmoryTab}. */
export interface ArmoryTabProps {
  loadout: Loadout;
  onLoadout: (l: Loadout) => void;
}

type Slot = 'primary' | 'secondary' | 'perks';

/**
 * Gunsmith-style loadout editor: primary, secondary and perks with a live weapon stats panel.
 * Keeps the Overkill rule (two primaries) and the no-duplicate-gun rule from the original menu.
 * @param props armory props
 * @returns armory tab
 */
export function ArmoryTab({ loadout, onLoadout }: ArmoryTabProps) {
  const [slot, setSlot] = useState<Slot>('primary');
  const [cls, setCls] = useState<string>('ALL');
  const [hovered, setHovered] = useState<string | null>(null);

  const primaries = ClassOrder.flatMap((c) => Object.values(Weapons).filter((w) => w.cls === c && isPrimary(w.name)));
  const overkill = loadout.perks.includes('Overkill');
  const sidearms = Object.values(Weapons).filter((w) => !isPrimary(w.name) && w.cls !== 'Melee');
  const secondaries = overkill ? [...primaries.filter((w) => w.name !== loadout.primary), ...sidearms] : sidearms;
  const pool = slot === 'primary' ? primaries : secondaries;
  const classes = ['ALL', ...Array.from(new Set(pool.map((w) => w.cls)))];
  const shown = cls === 'ALL' || !classes.includes(cls) ? pool : pool.filter((w) => w.cls === cls);

  const selectedName = slot === 'secondary' ? loadout.secondary : loadout.primary;
  const sel = Weapons[hovered ?? selectedName];
  const previewing = hovered !== null && hovered !== selectedName;

  const preview = (name: string) => ({
    onPointerEnter: () => setHovered(name),
    onPointerLeave: () => setHovered(null),
    onFocus: () => setHovered(name),
    onBlur: () => setHovered(null),
  });

  const pickWeapon = (w: WeaponCfg) => {
    if (slot === 'primary') {
      const secondary = loadout.secondary === w.name ? 'M1911' : loadout.secondary;
      onLoadout({ ...loadout, primary: w.name, secondary });
    } else {
      onLoadout({ ...loadout, secondary: w.name });
    }
  };
  const pickPerk = (p: PerkCfg) => {
    const perks = [...loadout.perks] as Loadout['perks'];
    perks[p.slot] = p.id;
    const secondary = !perks.includes('Overkill') && isPrimary(loadout.secondary) ? 'M1911' : loadout.secondary;
    onLoadout({ ...loadout, perks, secondary });
  };

  const slotTabs: { id: Slot; label: string; value: string }[] = [
    { id: 'primary', label: 'PRIMARY', value: loadout.primary },
    { id: 'secondary', label: 'SECONDARY', value: loadout.secondary },
    { id: 'perks', label: 'PERKS', value: loadout.perks.map((id) => Perks.find((p) => p.id === id)?.name ?? id).join(' · ') },
  ];

  return (
    <div className={styles.armory}>
      <div className={styles.slotRail}>
        {slotTabs.map((s) => (
          <button
            key={s.id}
            className={slot === s.id ? styles.slotTabActive : styles.slotTab}
            onClick={() => {
              setSlot(s.id);
              setCls('ALL');
            }}
          >
            <span className={styles.slotLabel}>{s.label}</span>
            <span className={styles.slotValue}>{s.value}</span>
          </button>
        ))}
      </div>

      <div className={styles.armoryBody}>
        <section>
          {slot !== 'perks' ? (
            <>
              <SectionTitle aside={slot === 'secondary' && overkill ? <span className={styles.overkillTag}>OVERKILL · PRIMARIES ALLOWED</span> : null}>
                {slot === 'primary' ? 'PRIMARY WEAPON' : 'SECONDARY WEAPON'}
              </SectionTitle>
              <div className={styles.filters}>
                {classes.map((c) => (
                  <button key={c} className={cls === c ? styles.filterActive : styles.filter} onClick={() => setCls(c)}>
                    {c}
                  </button>
                ))}
              </div>
              <div className={styles.weaponGrid}>
                {shown.map((w) => (
                  <button
                    key={w.name}
                    className={selectedName === w.name ? styles.weaponCardActive : styles.weaponCard}
                    onClick={() => pickWeapon(w)}
                    aria-pressed={selectedName === w.name}
                    {...preview(w.name)}
                  >
                    <span className={styles.cardClass}>{w.cls}</span>
                    <span className={styles.weaponSilhouette} style={{ ['--gun' as string]: `#${w.color.toString(16).padStart(6, '0')}` }} />
                    <span className={styles.cardName}>{w.name}</span>
                    {selectedName === w.name && <span className={styles.equipped}>EQUIPPED</span>}
                  </button>
                ))}
              </div>
            </>
          ) : (
            PerkSlotNames.map((label, i) => (
              <div key={label}>
                <SectionTitle>{label}</SectionTitle>
                <div className={styles.perkGrid}>
                  {Perks.filter((p) => p.slot === i).map((p) => (
                    <button
                      key={p.id}
                      className={`${loadout.perks[i] === p.id ? styles.perkCardActive : styles.perkCard} ${styles[`perk${i}`]}`}
                      onClick={() => pickPerk(p)}
                      aria-pressed={loadout.perks[i] === p.id}
                    >
                      <span className={styles.cardName}>{p.name}</span>
                      <span className={styles.perkDesc}>{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <aside className={styles.stats}>
          <div className={styles.cardClass}>
            {sel.cls}
            {previewing && <span className={styles.previewTag}>PREVIEW</span>}
          </div>
          <div className={styles.statName}>{sel.name}</div>
          <Stat label="Damage" v={(sel.projectile ? sel.projectile.damage[0] : sel.damage[0][1] * sel.pellets) / 250} />
          <Stat label="Fire rate" v={sel.rpm / 1000} />
          <Stat label="Range" v={(sel.damage[sel.damage.length - 1]?.[0] ?? 0) / 300} />
          <Stat label="Accuracy" v={1 - sel.spread.hip / 5} />
          <Stat label="Mobility" v={(sel.moveMult - 0.8) / 0.3} />
          <Stat label="Handling" v={1 - sel.adsTime / 0.35} />
          <div className={styles.statFacts}>
            <div><b>{sel.mag}</b><span>MAG</span></div>
            <div><b>{sel.rpm}</b><span>RPM</span></div>
            <div><b>{sel.fireMode}</b><span>MODE</span></div>
          </div>
          <div className={styles.statMeta}>Loadout changes apply on your next deploy.</div>
        </aside>
      </div>
    </div>
  );
}
