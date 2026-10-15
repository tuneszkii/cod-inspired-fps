import * as THREE from 'three';

interface Fx {
  obj: THREE.Object3D;
  life: number;
  max: number;
  update?: (f: number, dt: number) => void;
}

/**
 * Short-lived visual effects: tracers, impacts, blood puffs, explosions, smoke.
 */
export class Effects {
  private list: Fx[] = [];
  private tracerMat = new THREE.LineBasicMaterial({ color: 0xffe2a0, transparent: true, opacity: 0.9 });
  private sparkGeo = new THREE.SphereGeometry(0.12, 4, 3);
  private decalGeo = new THREE.PlaneGeometry(0.35, 0.35);
  private decalMat = new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.8, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 });
  private decals: THREE.Mesh[] = [];

  /** @param scene scene to spawn effects into */
  constructor(private scene: THREE.Scene) {}

  private add(obj: THREE.Object3D, life: number, update?: Fx['update']) {
    this.scene.add(obj);
    this.list.push({ obj, life, max: life, update });
  }

  /**
   * Bullet tracer line.
   * @param a start
   * @param b end
   * @param color line color
   */
  tracer(a: THREE.Vector3, b: THREE.Vector3, color = 0xffe2a0) {
    const dir = b.clone().sub(a);
    const len = dir.length();
    const segLen = Math.min(len, 9);
    const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 0, -segLen)]);
    const mat = color === 0xffe2a0 ? this.tracerMat.clone() : new THREE.LineBasicMaterial({ color, transparent: true });
    const line = new THREE.Line(geo, mat);
    line.position.copy(a);
    line.lookAt(b);
    const speed = 900;
    const life = Math.max(0.04, (len - segLen) / speed);
    this.add(line, life, (f) => {
      const t = 1 - f;
      line.position.copy(a).addScaledVector(dir, (t * (len - segLen)) / len + 0);
      line.position.copy(a).addScaledVector(dir.clone().normalize(), t * (len - segLen) + segLen);
      mat.opacity = 0.9;
    });
  }

  /**
   * Impact sparks + bullet hole decal.
   * @param p hit point
   * @param n surface normal
   */
  impact(p: THREE.Vector3, n: THREE.Vector3) {
    const dust = new THREE.MeshBasicMaterial({ color: 0xcbb994, transparent: true });
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(this.sparkGeo, i === 0 ? new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true }) : dust);
      s.position.copy(p);
      const v = n.clone().multiplyScalar(6 + Math.random() * 6).add(new THREE.Vector3((Math.random() - 0.5) * 8, Math.random() * 6, (Math.random() - 0.5) * 8));
      this.add(s, 0.35, (f, dt) => {
        v.y -= 40 * dt;
        s.position.addScaledVector(v, dt);
        s.scale.setScalar(1 - f * 0.4);
        (s.material as THREE.MeshBasicMaterial).opacity = 1 - f;
      });
    }
    const d = new THREE.Mesh(this.decalGeo, this.decalMat);
    d.position.copy(p).addScaledVector(n, 0.02);
    d.lookAt(p.clone().add(n));
    this.scene.add(d);
    this.decals.push(d);
    if (this.decals.length > 120) this.scene.remove(this.decals.shift()!);
  }

  /**
   * Blood puff on a character hit.
   * @param p hit point
   * @param head larger puff for headshots
   */
  blood(p: THREE.Vector3, head = false) {
    for (let i = 0; i < (head ? 8 : 4); i++) {
      const m = new THREE.Mesh(this.sparkGeo, new THREE.MeshBasicMaterial({ color: 0x8a0d0d, transparent: true }));
      m.position.copy(p);
      const v = new THREE.Vector3((Math.random() - 0.5) * 10, Math.random() * 8, (Math.random() - 0.5) * 10);
      this.add(m, 0.45, (f, dt) => {
        v.y -= 30 * dt;
        m.position.addScaledVector(v, dt);
        m.scale.setScalar(1.6 - f);
        (m.material as THREE.MeshBasicMaterial).opacity = 1 - f;
      });
    }
  }

  /**
   * Explosion fireball, flash light and smoke.
   * @param p center
   * @param radius blast radius (studs)
   */
  explosion(p: THREE.Vector3, radius: number) {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffa040, transparent: true }));
    ball.position.copy(p);
    this.add(ball, 0.5, (f) => {
      ball.scale.setScalar(1 + f * radius * 0.6);
      const m = ball.material as THREE.MeshBasicMaterial;
      m.opacity = 1 - f;
      m.color.setHSL(0.08 - f * 0.08, 1, 0.6 - f * 0.4);
    });
    const light = new THREE.PointLight(0xffaa55, 60, radius * 3, 1.5);
    light.position.copy(p).add(new THREE.Vector3(0, 2, 0));
    this.add(light, 0.35, (f) => (light.intensity = 60 * (1 - f)));
    for (let i = 0; i < 8; i++) this.smokePuff(p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 2, (Math.random() - 0.5) * 4)), 2.2, 0x555555);
  }

  /**
   * A single drifting smoke puff.
   * @param p position
   * @param size starting size
   * @param color smoke color
   * @param life seconds
   */
  smokePuff(p: THREE.Vector3, size: number, color = 0x777777, life = 1.6) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshLambertMaterial({ color, transparent: true, opacity: 0.6, depthWrite: false }));
    m.position.copy(p);
    const v = new THREE.Vector3((Math.random() - 0.5) * 3, 2 + Math.random() * 2, (Math.random() - 0.5) * 3);
    this.add(m, life, (f, dt) => {
      m.position.addScaledVector(v, dt);
      m.scale.setScalar(size * (1 + f * 1.5));
      (m.material as THREE.MeshLambertMaterial).opacity = 0.6 * (1 - f);
    });
  }

  /**
   * Steps all effects.
   * @param dt delta seconds
   */
  update(dt: number) {
    for (let i = this.list.length - 1; i >= 0; i--) {
      const fx = this.list[i];
      fx.life -= dt;
      const f = 1 - Math.max(fx.life, 0) / fx.max;
      fx.update?.(f, dt);
      if (fx.life <= 0) {
        this.scene.remove(fx.obj);
        this.list.splice(i, 1);
      }
    }
  }
}
