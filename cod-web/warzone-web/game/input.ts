/**
 * Keyboard + mouse + touch input (replaces Roblox `InputMap`).
 * Tracks held keys, edge-triggered presses and accumulated look delta.
 *
 * Input is gated on `active` (match running, not paused) — NOT on pointer lock.
 * Pointer lock is only an enhancement for mouse look: keyboard movement keeps working when the
 * browser refuses lock (embedded iframes, some browsers), and touch devices (no pointer lock) work too.
 */
export class Input {
  private down = new Set<string>();
  private pressed = new Set<string>();
  private released = new Set<string>();
  /** Virtual stick from touch controls, x = right, z = back. */
  private stick = { x: 0, z: 0 };
  mouseDX = 0;
  mouseDY = 0;
  /** Wheel direction this frame (-1, 0, 1). */
  wheel = 0;
  /** True while the pointer is locked to the game canvas. */
  locked = false;
  /** True while the match accepts input (playing, not paused). */
  active = false;
  /** True on touch-first devices (phones / tablets). */
  readonly touch: boolean;
  private readonly canLock: boolean;
  private cleanup: (() => void)[] = [];

  /**
   * @param el element that receives pointer lock
   * @param onActiveChange called when the match becomes active (true) or paused (false)
   */
  constructor(private el: HTMLElement, private onActiveChange: (active: boolean) => void) {
    this.touch = isTouchDevice();
    this.canLock = typeof el.requestPointerLock === 'function' && !this.touch;

    const on = <K extends keyof DocumentEventMap>(t: K, f: (e: DocumentEventMap[K]) => void, opts?: AddEventListenerOptions) => {
      document.addEventListener(t, f as EventListener, opts);
      this.cleanup.push(() => document.removeEventListener(t, f as EventListener, opts));
    };
    on('keydown', (e) => {
      if (!this.active) return;
      if (['Tab', 'Space', 'ControlLeft', 'KeyC', 'ArrowUp', 'ArrowDown'].includes(e.code)) e.preventDefault();
      if (e.repeat) return;
      // without pointer lock the browser doesn't consume Esc, so pause ourselves
      if (e.code === 'Escape' && !this.locked) {
        this.setActive(false);
        return;
      }
      this.press(e.code);
    });
    on('keyup', (e) => this.release(e.code));
    on('mousedown', (e) => {
      if (!this.active || this.touch) return;
      // lock may have been refused or lost without pausing — retry on click (a valid user gesture)
      if (this.canLock && !this.locked) this.requestLock();
      this.press(`Mouse${e.button}`);
    });
    on('mouseup', (e) => this.release(`Mouse${e.button}`));
    on('mousemove', (e) => {
      if (!this.active || this.touch) return;
      // unlocked fallback: look by dragging with a mouse button held
      if (!this.locked && e.buttons === 0) return;
      if (Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) return; // browser spikes
      this.mouseDX += e.movementX;
      this.mouseDY += e.movementY;
    });
    on('contextmenu', (e) => {
      if (this.active) e.preventDefault();
    });
    on('wheel', (e) => {
      if (this.active) this.wheel = Math.sign(e.deltaY);
    });
    on('pointerlockchange', () => {
      const wasLocked = this.locked;
      this.locked = document.pointerLockElement === this.el;
      // the browser released lock (user pressed Esc) → pause
      if (wasLocked && !this.locked && this.active) this.setActive(false);
    });
    const blur = () => this.clearHeld();
    window.addEventListener('blur', blur);
    this.cleanup.push(() => window.removeEventListener('blur', blur));
  }

  /**
   * Starts accepting input (deploy / resume) and requests pointer lock on desktop when available.
   * Call from a user gesture so the browser grants pointer lock.
   */
  lock() {
    this.setActive(true);
    if (this.canLock) this.requestLock();
  }

  /** Pauses input and releases pointer lock. */
  pause() {
    this.setActive(false);
    if (document.pointerLockElement === this.el) document.exitPointerLock();
  }

  private requestLock() {
    try {
      const p = this.el.requestPointerLock() as unknown as Promise<void> | undefined;
      if (p && typeof p.catch === 'function') p.catch(() => undefined);
    } catch {
      /* lock unsupported or refused — keyboard + drag-look still work */
    }
  }

  private setActive(active: boolean) {
    if (this.active === active) return;
    this.active = active;
    if (!active) this.clearHeld();
    this.onActiveChange(active);
  }

  private clearHeld() {
    this.down.forEach((k) => this.released.add(k));
    this.down.clear();
    this.stick.x = 0;
    this.stick.z = 0;
  }

  private press(code: string) {
    if (this.down.has(code)) return;
    this.down.add(code);
    this.pressed.add(code);
  }

  private release(code: string) {
    if (!this.down.delete(code)) return;
    this.released.add(code);
  }

  /**
   * Virtual key from touch controls.
   * @param code key code to emulate (e.g. `Space`, `Mouse0`)
   * @param isDown pressed or released
   */
  setKey(code: string, isDown: boolean) {
    if (isDown) {
      if (this.active) this.press(code);
    } else this.release(code);
  }

  /**
   * Virtual movement stick from touch controls.
   * @param x right (-1..1)
   * @param z back (-1..1); negative is forward
   */
  setStick(x: number, z: number) {
    this.stick.x = this.active ? x : 0;
    this.stick.z = this.active ? z : 0;
  }

  /**
   * Adds look delta from touch drags, in mouse-movement units.
   * @param dx horizontal delta
   * @param dy vertical delta
   */
  addLook(dx: number, dy: number) {
    if (!this.active) return;
    this.mouseDX += dx;
    this.mouseDY += dy;
  }

  /**
   * @param code KeyboardEvent.code or `Mouse0`/`Mouse2`
   * @returns true while held
   */
  isDown(code: string) {
    return this.down.has(code);
  }

  /**
   * @param code key code
   * @returns true on the frame the key went down
   */
  wasPressed(code: string) {
    return this.pressed.has(code);
  }

  /**
   * @param code key code
   * @returns true on the frame the key was released
   */
  wasReleased(code: string) {
    return this.released.has(code);
  }

  /**
   * Movement vector, x = right, z = back (Roblox convention). Combines WASD / arrows and the touch stick.
   * @returns direction with magnitude 0..1
   */
  moveVector() {
    let x = this.stick.x;
    let z = this.stick.z;
    if (this.down.has('KeyW') || this.down.has('ArrowUp')) z -= 1;
    if (this.down.has('KeyS') || this.down.has('ArrowDown')) z += 1;
    if (this.down.has('KeyA') || this.down.has('ArrowLeft')) x -= 1;
    if (this.down.has('KeyD') || this.down.has('ArrowRight')) x += 1;
    const m = Math.hypot(x, z);
    if (m < 0.08) return { x: 0, z: 0, mag: 0 };
    const mag = Math.min(1, m);
    return { x: (x / m) * mag, z: (z / m) * mag, mag };
  }

  /** Clears per-frame state; call at the end of each frame. */
  endFrame() {
    this.pressed.clear();
    this.released.clear();
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.wheel = 0;
  }

  /** Removes all listeners. */
  dispose() {
    this.cleanup.forEach((f) => f());
    if (document.pointerLockElement === this.el) document.exitPointerLock();
  }
}

/**
 * Detects touch-first devices (phones / tablets) where pointer lock and keyboard aren't available.
 * @returns true on touch-first devices
 */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  // manual override for testing: ?touch=1 / ?touch=0
  const forced = new URLSearchParams(window.location.search).get('touch');
  if (forced === '1') return true;
  if (forced === '0') return false;
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const fine = window.matchMedia?.('(any-pointer: fine)').matches ?? false;
  return coarse && !fine ? true : coarse || (navigator.maxTouchPoints > 0 && !fine);
}
