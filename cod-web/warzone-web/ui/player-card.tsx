import { CallingCards, Operators, findCosmetic, type Cosmetics } from '../game/cosmetics.js';
import styles from './menu.module.css';

/** Props for {@link PlayerCard}. */
export interface PlayerCardProps {
  cosmetics: Cosmetics;
  /** Larger variant used as the Cosmetics tab preview. */
  large?: boolean;
}

/**
 * Calling-card banner with operator emblem and callsign, shown in the menu top bar.
 * @param props player card props
 * @returns player card
 */
export function PlayerCard({ cosmetics, large }: PlayerCardProps) {
  const card = findCosmetic(CallingCards, cosmetics.callingCard);
  const op = findCosmetic(Operators, cosmetics.operator);
  return (
    <div className={large ? styles.playerCardLarge : styles.playerCard} style={{ background: card.background }}>
      <div className={styles.emblem} style={{ borderColor: op.accent, color: op.accent }}>
        {op.name.slice(0, 1)}
      </div>
      <div className={styles.playerCardText}>
        <span className={styles.callsign}>{cosmetics.callsign || 'OPERATOR'}</span>
        <span className={styles.playerMeta}>
          {op.name} · {op.faction}
        </span>
      </div>
    </div>
  );
}
