import styles from './menu.module.css';

/**
 * Horizontal stat bar used in the Armory weapon panel.
 * @param props label and normalized value (0..1)
 * @returns stat row
 */
export function Stat({ label, v }: { label: string; v: number }) {
  const c = Math.max(0.05, Math.min(1, v));
  return (
    <div className={styles.stat}>
      <span>{label}</span>
      <div className={styles.statTrack}>
        <div style={{ width: `${c * 100}%` }} />
      </div>
    </div>
  );
}

/** Props for {@link Slider}. */
export interface SliderProps {
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  fmt: (v: number) => string;
  onChange: (v: number) => void;
}

/**
 * Labelled range slider for the Settings tab.
 * @param p slider props
 * @returns slider row
 */
export function Slider(p: SliderProps) {
  const pct = ((p.value - p.min) / (p.max - p.min)) * 100;
  return (
    <label className={styles.slider}>
      <span className={styles.sliderLabel}>
        {p.label}
        {p.hint && <small>{p.hint}</small>}
      </span>
      <input
        type="range"
        min={p.min}
        max={p.max}
        step={p.step}
        value={p.value}
        style={{ ['--pct' as string]: `${pct}%` }}
        onChange={(e) => p.onChange(Number(e.target.value))}
      />
      <b>{p.fmt(p.value)}</b>
    </label>
  );
}

/** Props for {@link Segmented}. */
export interface SegmentedProps<T extends string> {
  label: string;
  hint?: string;
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}

/**
 * Labelled segmented control (single choice) for the Settings tab.
 * @param p segmented props
 * @returns setting row
 */
export function Segmented<T extends string>(p: SegmentedProps<T>) {
  return (
    <div className={styles.setRow}>
      <span className={styles.sliderLabel}>
        {p.label}
        {p.hint && <small>{p.hint}</small>}
      </span>
      <div className={styles.segmented} role="radiogroup" aria-label={p.label}>
        {p.options.map((o) => (
          <button key={o.value} role="radio" aria-checked={p.value === o.value} className={p.value === o.value ? styles.segActive : styles.seg} onClick={() => p.onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Props for {@link Toggle}. */
export interface ToggleProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

/**
 * Labelled on/off switch for the Settings tab.
 * @param p toggle props
 * @returns setting row
 */
export function Toggle(p: ToggleProps) {
  return (
    <div className={styles.setRow}>
      <span className={styles.sliderLabel}>
        {p.label}
        {p.hint && <small>{p.hint}</small>}
      </span>
      <button role="switch" aria-checked={p.checked} aria-label={p.label} className={p.checked ? styles.switchOn : styles.switchOff} onClick={() => p.onChange(!p.checked)}>
        <i />
        <span>{p.checked ? 'ON' : 'OFF'}</span>
      </button>
    </div>
  );
}

/** Props for {@link SectionTitle}. */
export interface SectionTitleProps {
  children: React.ReactNode;
  aside?: React.ReactNode;
}

/**
 * Small uppercase section heading with an accent tick, Warzone-style.
 * @param props title text and optional right-aligned content
 * @returns heading
 */
export function SectionTitle({ children, aside }: SectionTitleProps) {
  return (
    <h2 className={styles.h2}>
      <span>{children}</span>
      {aside}
    </h2>
  );
}
