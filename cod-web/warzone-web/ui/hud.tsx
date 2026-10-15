import type { HudState } from '../game/hud-state.js';
import styles from './hud.module.css';

/** Props for {@link Hud}. */
export interface HudProps {
  /** Latest snapshot from the game loop. */
  s: HudState;
  /** Crosshair color (CSS). Defaults to white. */
  reticleColor?: string;
  /** Show the FPS counter (graphics setting). Defaults to true. */
  showFps?: boolean;
}

/**
 * In-game HUD in the MW2019 style: crosshair, hitmarkers, health/armor plates, ammo,
 * equipment, kill feed, XP popups, medals, radar, damage indicators, scoreboard and death screen.
 * @param props HUD props
 * @returns HUD overlay
 */
export function Hud({ s, reticleColor, showFps = true }: HudProps) {
  const hitVisible = s.hitmarkerAge < (s.hitmarkerKill ? 0.35 : 0.18);
  const gap = Math.max(4, Math.min(80, s.spreadPx));
  const crossOpacity = s.scoped || s.weaponClass === 'Melee' ? 0 : Math.max(0, 1 - s.ads * 1.6) * (s.stance === 'Sprint' || s.stance === 'TacSprint' ? 0 : 1);
  const armorPlates = [0, 1, 2].map((i) => Math.max(0, Math.min(1, (s.armor - i * 50) / 50)));
  const lowAmmo = s.ammo <= Math.ceil(0.25 * (s.ammo + 1)) && s.ammo < 6;

  return (
    <div className={styles.hud}>
      {/* sniper scope */}
      {s.scoped && (
        <div className={styles.scope}>
          <div className={styles.scopeLens}>
            <div className={styles.scopeH} />
            <div className={styles.scopeV} />
            <div className={styles.scopeDot} />
          </div>
          {!s.holdingBreath && <div className={styles.breathHint}>SHIFT · HOLD BREATH</div>}
        </div>
      )}

      {/* loot */}
      {s.pickupPrompt && !s.dead && (
        <div className={styles.pickupPrompt}>
          <span className={styles.pickupKey}>E</span> {s.pickupPrompt}
        </div>
      )}
      {s.lootToast && !s.dead && <div className={styles.lootToast}>{s.lootToast}</div>}

      {/* crosshair */}
      <div className={styles.cross} style={{ opacity: crossOpacity, ...(reticleColor ? { ['--reticle' as string]: reticleColor } : {}) }}>
        <span className={styles.ch} style={{ transform: `translate(-50%, -50%) translateX(${-gap - 6}px)` }} />
        <span className={styles.ch} style={{ transform: `translate(-50%, -50%) translateX(${gap + 6}px)` }} />
        <span className={styles.cv} style={{ transform: `translate(-50%, -50%) translateY(${-gap - 6}px)` }} />
        <span className={styles.cv} style={{ transform: `translate(-50%, -50%) translateY(${gap + 6}px)` }} />
        <span className={styles.dot} />
      </div>

      {/* hitmarker */}
      {hitVisible && (
        <div className={`${styles.hit} ${s.hitmarkerKill ? styles.hitKill : ''} ${s.hitmarkerHead ? styles.hitHead : ''}`}>
          <span /> <span /> <span /> <span />
        </div>
      )}

      {/* damage direction */}
      {s.damageDirs.map((d, i) => (
        <div key={i} className={styles.dmgDir} style={{ transform: `translate(-50%, -50%) rotate(${d.angle}rad)`, opacity: 1 - d.age / 1.6 }}>
          <div className={styles.dmgArc} />
        </div>
      ))}

      {/* radar */}
      <div className={styles.radar}>
        <div className={styles.radarSweep} />
        <div className={styles.radarMe} />
        {s.radar.map((d, i) => (
          <div key={i} className={styles.radarDot} style={{ left: `${50 + d.x * 46}%`, top: `${50 + d.y * 46}%` }} />
        ))}
        <div className={styles.radarN}>N</div>
        {s.uav > 0 && <div className={styles.uavTag}>UAV {Math.ceil(s.uav)}s</div>}
      </div>

      {/* killstreak rewards */}
      <div className={styles.streakTray}>
        {s.streaks.map((k, i) => (
          <div key={`${k.id}-${i}`} className={styles.streakCard} style={{ ['--streak' as string]: k.color }}>
            <kbd>{i === 0 ? 'T' : i + 1}</kbd>
            <span>{k.name}</span>
          </div>
        ))}
        {s.nextStreak && (
          <div className={styles.streakNext} style={{ ['--streak' as string]: s.nextStreak.color }}>
            <span>
              NEXT: <b>{s.nextStreak.name}</b>
            </span>
            <small>{s.nextStreak.remaining} {s.nextStreak.remaining === 1 ? 'KILL' : 'KILLS'}</small>
          </div>
        )}
      </div>

      {/* score top center */}
      <div className={styles.topScore}>
        <div className={styles.mode}>FREE-FOR-ALL</div>
        <div className={styles.kd}>
          <b>{s.kills}</b> <small>KILLS</small> <span className={styles.sep}>·</span> <b>{s.deaths}</b> <small>DEATHS</small>
          {s.streak >= 2 && (
            <>
              <span className={styles.sep}>·</span> <b className={styles.streak}>{s.streak}</b> <small>STREAK</small>
            </>
          )}
        </div>
      </div>

      {/* kill feed */}
      <div className={styles.feed}>
        {s.killFeed.map((k) => (
          <div key={k.id} className={styles.feedRow}>
            <span className={k.killerIsPlayer ? styles.you : styles.enemy}>{k.killer}</span>
            <span className={styles.feedWeapon}>
              [{k.weapon}]{k.headshot && <span className={styles.hs}> ✛</span>}
            </span>
            <span className={k.victimIsPlayer ? styles.you : styles.enemy}>{k.victim}</span>
          </div>
        ))}
      </div>

      {/* XP popups */}
      <div className={styles.popups}>
        {s.popups.map((p) => (
          <div key={p.id} className={styles.popup}>
            <span>{p.label}</span> <b>+{p.xp}</b>
          </div>
        ))}
      </div>

      {/* medal */}
      {s.medal && (
        <div key={s.medal.id} className={styles.medal}>
          <div className={styles.medalIcon}>★</div>
          <div className={styles.medalLabel}>{s.medal.label}</div>
          <div className={styles.medalXp}>+{s.medal.xp}</div>
        </div>
      )}

      {/* plate progress */}
      {s.plateProgress > 0 && (
        <div className={styles.plateBar}>
          <div className={styles.plateLabel}>APPLYING ARMOR PLATE</div>
          <div className={styles.barTrack}>
            <div className={styles.barFill} style={{ width: `${s.plateProgress * 100}%` }} />
          </div>
        </div>
      )}

      {/* cook timer */}
      {s.cookProgress > 0 && (
        <div className={styles.cook}>
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="16" className={styles.cookTrack} />
            <circle cx="20" cy="20" r="16" className={styles.cookFill} style={{ strokeDashoffset: 100.5 * s.cookProgress }} />
          </svg>
        </div>
      )}

      {/* bottom left: vitals */}
      <div className={styles.vitals}>
        <div className={styles.plates}>
          {armorPlates.map((f, i) => (
            <div key={i} className={styles.plateSeg}>
              <div style={{ width: `${f * 100}%` }} />
            </div>
          ))}
        </div>
        <div className={styles.healthTrack}>
          <div className={styles.healthFill} style={{ width: `${(s.health / s.maxHealth) * 100}%` }} />
        </div>
        <div className={styles.vitalsRow}>
          <span className={styles.plateCount}>▣ {s.plates} <small>PLATES · X</small></span>
          <span className={styles.level}>LV {s.level}</span>
        </div>
        <div className={styles.xpTrack}>
          <div style={{ width: `${s.levelProgress * 100}%` }} />
        </div>
      </div>

      {/* bottom right: weapon */}
      <div className={styles.weapon}>
        <div className={styles.equip}>
          <span className={s.flashes ? '' : styles.dim}>◎ {s.flashes} <small>Q</small></span>
          <span className={s.frags ? '' : styles.dim}>● {s.frags} <small>G</small></span>
        </div>
        {s.weaponClass !== 'Melee' && (
          <div className={styles.ammoRow}>
            <span className={`${styles.ammo} ${lowAmmo ? styles.low : ''}`}>{s.ammo}</span>
            <span className={styles.reserve}>{s.reserve}</span>
          </div>
        )}
        <div className={styles.weaponName}>{s.weaponName}</div>
        <div className={styles.slots}>
          <span className={s.slot === 0 ? styles.slotActive : ''}>1 {s.primaryName}</span>
          <span className={s.slot === 1 ? styles.slotActive : ''}>2 {s.secondaryName}</span>
          <span className={s.slot === 2 ? styles.slotActive : ''}>3 {s.meleeName}</span>
        </div>
        {s.reloading && <div className={styles.reload}>RELOADING</div>}
        {s.weaponClass !== 'Melee' && !s.reloading && s.ammo === 0 && s.reserve > 0 && <div className={styles.reload}>PRESS R TO RELOAD</div>}
        {s.weaponClass !== 'Melee' && !s.reloading && s.ammo === 0 && s.reserve === 0 && <div className={styles.reload}>NO AMMO</div>}
      </div>

      {s.tacSprint && <div className={styles.tac}>TACTICAL SPRINT</div>}
      {showFps && <div className={styles.fps}>{s.fps} FPS</div>}

      {/* overlays */}
      <div className={styles.hurt} style={{ opacity: s.hurt }} />
      <div className={styles.flash} style={{ opacity: s.flash }} />

      {s.dead && (
        <div className={styles.death}>
          <div className={styles.deathTitle}>KILLED BY</div>
          <div className={styles.deathName}>{s.killedBy}</div>
          <div className={styles.deathTimer}>Respawning in {s.respawnIn.toFixed(1)}s</div>
        </div>
      )}

      {s.showScoreboard && (
        <div className={styles.board}>
          <div className={styles.boardHead}>
            <span>PLAYER</span>
            <span>K</span>
            <span>D</span>
            <span>K/D</span>
          </div>
          {s.scoreboard.map((r) => (
            <div key={r.name} className={`${styles.boardRow} ${r.isPlayer ? styles.boardMe : ''}`}>
              <span>{r.name}</span>
              <span>{r.kills}</span>
              <span>{r.deaths}</span>
              <span>{(r.kills / Math.max(1, r.deaths)).toFixed(2)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
