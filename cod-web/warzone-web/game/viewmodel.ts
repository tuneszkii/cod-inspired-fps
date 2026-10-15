import * as THREE from 'three';
import { deg, type WeaponCfg } from './config.js';
import { buildGun, type GunModel } from './gun-model.js';
import type { CamoCfg, OperatorCfg } from './cosmetics.js';
import { Pose } from './pose.js';
import { Spring, smooth } from './spring.js';
import type { Movement } from './movement.js';

/** Viewmodel poses from `Config.Viewmodel` (camera space). */
const V = {
  upperLen: 1.35,
  foreLen: 1.35,
  rShoulder: new THREE.Vector3(0.8, -1.45, 0.1),
  lShoulder: new THREE.Vector3(-0.55, -1.55, -0.1),
  rHint: new THREE.Vector3(2.4, -3, 0),
  lHint: new THREE.Vector3(-1.2, -3.2, -0.6),
  eyeRelief: 1.1,
  hip: Pose.of(0.6, -0.6, -1.75),
  sprint: Pose.of(0.4, -0.85, -1.15, deg(-22), deg(38), deg(10)),
  tac: Pose.of(0.45, -1.0, -0.95, deg(-32), deg(46), deg(14)),
  slide: Pose.of(0.25, -0.78, -1.2, deg(-8), deg(18), deg(-20)),
  reload: Pose.of(-0.1, 0.05, 0.15, deg(12), deg(-10), deg(-32)),
  drop: Pose.of(0.35, -1.7, 0.8, deg(-55), deg(20), deg(-15)),
};

/** Gun animation kinds driven by the weapon controller. */
export type GunAnimKind = 'Reload' | 'Bolt' | 'Pump' | 'Shell' | 'Break';
/** Chest-space tracks (gun lowered, hands doing something else). */
export type TrackKind = 'Throw' | 'Plate' | 'Melee' | 'Slash' | 'Stab';


/** Smoothstep-ish ease. */
const ease = (t: number) => t * t * (3 - 2 * t);
/** Maps f in [a,b] to 0..1 (clamped). */
const seg = (f: number, a: number, b: number) => THREE.MathUtils.clamp((f - a) / (b - a), 0, 1);

/**
 * First-person viewmodel: spring sway / bob / kick, ADS blend, reload and bolt animations and
 * two-bone IK arms. Port of `Viewmodel.luau` + `IK.luau`. Rendered in its own scene on top of the world.
 */
export class Viewmodel {
  scene = new THREE.Scene();
  camera: THREE.PerspectiveCamera;
  gun: GunModel | null = null;
  cfg: WeaponCfg | null = null;
  private arms: { upper: THREE.Mesh; fore: THREE.Mesh; hand: THREE.Mesh }[] = [];
  private swayRot = new Spring(14, 0.7);
  private swayPos = new Spring(12, 0.75);
  private moveSpring = new Spring(9, 0.7);
  private kickPos = new Spring(22, 0.55);
  private kickRot = new Spring(20, 0.5);
  private equip = new Spring(14, 0.85, new THREE.Vector3(1, 0, 0));
  private bobT = 0;
  private wall = 0;
  private gunAnim: { kind: GunAnimKind; t: number; T: number } | null = null;
  private track: { kind: TrackKind; t: number; T: number } | null = null;
  private item: THREE.Object3D | null = null;
  private flashTimer = 0;
  /** Muzzle position in camera space (multiply by the world camera matrix to get world space). */
  muzzleWorld = new THREE.Vector3();
  /** Scaled container for gun + arms, so stud-sized models sit at a natural first-person size. */
  private rig = new THREE.Group();
  /** Operator skin materials for sleeves / gloves (per instance so cosmetics can recolor them). */
  private sleeveMat = new THREE.MeshStandardMaterial({ color: 0x5a6648, roughness: 0.9 });
  private gloveMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.7 });
  /** Camo applied to every gun the player equips. */
  private camo: CamoCfg | undefined;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(62, 1, 0.1, 50);
    this.scene.add(new THREE.HemisphereLight(0xeef2f8, 0x6a6050, 2.4));
    const sun = new THREE.DirectionalLight(0xfff1dc, 3.2);
    sun.position.set(2, 4, 1);
    this.scene.add(sun);
    const rim = new THREE.DirectionalLight(0xb8c8ff, 1.2);
    rim.position.set(-3, 1, -2);
    this.scene.add(rim);
    this.scene.add(this.camera);
    this.rig.scale.setScalar(0.34);
    this.camera.add(this.rig);
    for (let i = 0; i < 2; i++) {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 1), this.sleeveMat);
      const fore = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 1), this.sleeveMat);
      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.16, 0.3), this.gloveMat);
      this.rig.add(upper, fore, hand);
      this.arms.push({ upper, fore, hand });
    }
  }

  /**
   * Applies cosmetic choices: operator sleeve/glove colors and weapon camo (used for guns equipped afterwards).
   * @param operator operator skin
   * @param camo weapon camo
   */
  setCosmetics(operator: OperatorCfg, camo: CamoCfg) {
    this.sleeveMat.color.setHex(operator.sleeve);
    this.gloveMat.color.setHex(operator.glove);
    this.camo = camo;
  }

  /**
   * Swaps in a new gun model and plays the raise animation.
   * @param cfg weapon config
   */
  setWeapon(cfg: WeaponCfg) {
    if (this.gun) this.rig.remove(this.gun.root);
    this.cfg = cfg;
    this.gun = buildGun(cfg, cfg.cls === 'Melee' ? undefined : this.camo);
    this.rig.add(this.gun.root);
    this.equip.position.set(1, 0, 0);
    this.equip.velocity.set(0, 0, 0);
    this.gunAnim = null;
  }

  /** Recoil kick. @param k strength (weapon Kick) @param ads 0..1 ADS alpha */
  fire(k: number, ads: number) {
    const m = 1 - ads * 0.45;
    this.kickPos.impulse(new THREE.Vector3((Math.random() - 0.5) * 0.5 * k * m, 0.3 * k * m, 3.2 * k * m));
    this.kickRot.impulse(new THREE.Vector3(1.3 * k * m, (Math.random() - 0.5) * 0.9 * k, (Math.random() - 0.5) * 1.4 * k));
    if (this.gun) {
      this.gun.flash.visible = true;
      this.gun.flash.rotation.y = Math.random() * Math.PI;
      this.gun.flash.scale.setScalar(0.8 + Math.random() * 0.6);
      this.gun.flashLight.intensity = 6;
      this.flashTimer = 0.045;
    }
  }

  /** Landing dip. @param speed impact speed */
  land(speed: number) {
    this.kickPos.impulse(new THREE.Vector3(0, -THREE.MathUtils.clamp(speed * 0.04, 0, 2.5), 0.4));
  }

  /** Slide start kick. */
  slideKick() {
    this.kickPos.impulse(new THREE.Vector3(0, -1.2, 0.5));
    this.kickRot.impulse(new THREE.Vector3(-0.6, 0, 0.8));
  }

  /**
   * Plays a gun animation.
   * @param kind animation kind
   * @param duration seconds
   */
  playGunAnim(kind: GunAnimKind, duration: number) {
    this.gunAnim = { kind, t: 0, T: Math.max(duration, 0.05) };
  }

  /** Stops the current gun animation. */
  cancelGunAnim() {
    this.gunAnim = null;
  }

  /**
   * Starts a chest-space track with an optional held item.
   * @param kind track
   * @param duration seconds
   * @param item mesh held in the left hand
   */
  startTrack(kind: TrackKind, duration: number, item?: THREE.Object3D) {
    this.endTrack();
    this.track = { kind, t: 0, T: duration };
    if (item) {
      this.item = item;
      this.rig.add(item);
    }
  }

  /** Releases the held item (e.g. on throw). */
  dropItem() {
    if (this.item) this.rig.remove(this.item);
    this.item = null;
  }

  /** Ends the current track. */
  endTrack() {
    this.track = null;
    this.dropItem();
  }

  /** Resize. @param aspect viewport aspect ratio */
  resize(aspect: number) {
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  private solveArm(i: number, shoulder: THREE.Vector3, hint: THREE.Vector3, target: THREE.Vector3, handQ: THREE.Quaternion) {
    const a = V.upperLen;
    const b = V.foreLen;
    const toT = target.clone().sub(shoulder);
    const d = THREE.MathUtils.clamp(toT.length(), 0.05, a + b - 0.001);
    const dir = toT.normalize();
    const cosA = THREE.MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1);
    const sinA = Math.sqrt(1 - cosA * cosA);
    const h = hint.clone().sub(shoulder);
    const n = h.sub(dir.clone().multiplyScalar(h.dot(dir))).normalize();
    const elbow = shoulder.clone().addScaledVector(dir, a * cosA).addScaledVector(n, a * sinA);
    const wrist = shoulder.clone().addScaledVector(dir, d);
    const place = (m: THREE.Mesh, p: THREE.Vector3, q: THREE.Vector3, len: number) => {
      m.position.copy(p).add(q).multiplyScalar(0.5);
      m.scale.set(1, 1, len);
      // box length runs along -Z; orient it from p to q in rig-local space
      const dirPQ = q.clone().sub(p).normalize();
      m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), dirPQ);
    };
    const arm = this.arms[i];
    place(arm.upper, shoulder, elbow, a);
    place(arm.fore, elbow, wrist, b);
    arm.hand.position.copy(wrist);
    arm.hand.quaternion.copy(handQ);
  }

  /**
   * Per-frame update.
   * @param dt delta seconds
   * @param mv movement state
   * @param ads eased ADS alpha 0..1
   * @param mouseDX mouse delta x this frame
   * @param mouseDY mouse delta y this frame
   * @param wallDist distance to a wall in front of the camera (Infinity if none)
   * @param hidden hide the viewmodel (sniper scope overlay)
   * @param now time seconds
   */
  update(dt: number, mv: Movement, ads: number, mouseDX: number, mouseDY: number, wallDist: number, hidden: boolean, now: number, yaw: number) {
    const G = this.gun;
    if (!G) return;
    G.root.visible = !hidden;
    this.arms.forEach((a) => {
      a.upper.visible = a.fore.visible = a.hand.visible = !hidden;
    });

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        G.flash.visible = false;
        G.flashLight.intensity = 0;
      }
    }

    const adsK = 1 - 0.85 * ads;
    const mx = THREE.MathUtils.clamp(mouseDX, -50, 50);
    const my = THREE.MathUtils.clamp(mouseDY, -50, 50);
    this.swayRot.target.set(my * 0.0016, mx * 0.0016, mx * 0.001);
    this.swayPos.target.set(-mx * 0.0007, my * 0.0007, 0);
    const sr = this.swayRot.update(dt);
    const sp = this.swayPos.update(dt);

    // velocity in camera (yaw) space
    const s = Math.sin(yaw);
    const c = Math.cos(yaw);
    const lx = mv.vel.x * c - mv.vel.z * s;
    const lz = mv.vel.x * s + mv.vel.z * c;
    this.moveSpring.target.set(-THREE.MathUtils.clamp(lx, -20, 20) * 0.0035, THREE.MathUtils.clamp(-mv.vel.y, -60, 60) * 0.0016, THREE.MathUtils.clamp(lz, -30, 30) * 0.0012);
    const mvs = this.moveSpring.update(dt);
    const strafeRoll = -THREE.MathUtils.clamp(lx, -20, 20) * 0.003;

    const speed = mv.grounded ? mv.speed : 0;
    this.bobT += dt * speed * 0.6;
    const amp = THREE.MathUtils.clamp(speed / 12, 0, 1.6) * (1 + mv.alpha.sprint * 0.6);
    const bobPos = new THREE.Vector3(Math.sin(this.bobT) * 0.03, Math.sin(this.bobT * 2) * 0.02, 0).multiplyScalar(amp);
    const bobRot = new THREE.Vector3(Math.sin(this.bobT * 2) * 0.01, Math.sin(this.bobT) * 0.015, Math.sin(this.bobT) * 0.02).multiplyScalar(amp);
    const breath = Math.sin(now * 1.7) * 0.004;

    const kp = this.kickPos.update(dt);
    const kr = this.kickRot.update(dt);
    this.equip.target.set(0, 0, 0);
    const e = this.equip.update(dt).x;
    const equipPose = Pose.of(0.25 * e, -1.1 * e, 0.5 * e, deg(-50) * e, deg(20) * e, deg(-12) * e);

    // ---- gun animation
    let leftPos = G.leftGrip.clone();
    let rightPos = G.rightGrip.clone();
    let rAlpha = 0;
    let magOff = new THREE.Vector3();
    let magVisible = true;
    let pumpOff = 0;
    let boltOff = 0;
    const ga = this.gunAnim;
    if (ga) {
      ga.t += dt;
      const f = ga.t / ga.T;
      if (f >= 1) this.gunAnim = null;
      else {
        rAlpha = Math.sin(Math.PI * Math.min(1, f * 1.1)) ** 0.7;
        if (ga.kind === 'Reload' || ga.kind === 'Break') {
          const magPos = G.mag ? G.magRest.clone() : G.leftGrip.clone().add(new THREE.Vector3(0, -0.2, 0.3));
          const off = new THREE.Vector3(-0.2, -1.6, 0.4);
          if (f < 0.2) leftPos = G.leftGrip.clone().lerp(magPos, ease(seg(f, 0, 0.2)));
          else if (f < 0.45) {
            const k = ease(seg(f, 0.2, 0.45));
            leftPos = magPos.clone().add(off.clone().multiplyScalar(k));
            magOff = off.clone().multiplyScalar(k);
            magVisible = k < 0.9;
          } else if (f < 0.7) {
            const k = ease(seg(f, 0.45, 0.7));
            leftPos = magPos.clone().add(off.clone().multiplyScalar(1 - k));
            magOff = off.clone().multiplyScalar(1 - k);
          } else if (f < 0.82) {
            leftPos = magPos.clone().add(new THREE.Vector3(0, -0.05 * (1 - seg(f, 0.7, 0.82)), 0));
          } else leftPos = magPos.clone().lerp(G.leftGrip, ease(seg(f, 0.82, 1)));
          if (f > 0.84 && f < 0.95 && this.cfg?.cls !== 'Launcher') {
            const k = Math.sin(Math.PI * seg(f, 0.84, 0.95));
            rightPos = G.rightGrip.clone().add(new THREE.Vector3(0.1, 0.35 * k, -0.2 * k));
          }
        } else if (ga.kind === 'Bolt') {
          rAlpha *= 0.35;
          const boltPos = new THREE.Vector3(0.2, 0.08, 0.05);
          if (f < 0.25) rightPos = G.rightGrip.clone().lerp(boltPos, ease(seg(f, 0, 0.25)));
          else if (f < 0.7) {
            const k = Math.sin(Math.PI * seg(f, 0.25, 0.7));
            boltOff = 0.35 * k;
            rightPos = boltPos.clone().add(new THREE.Vector3(0, 0.05 * k, boltOff));
          } else rightPos = boltPos.clone().lerp(G.rightGrip, ease(seg(f, 0.7, 1)));
        } else if (ga.kind === 'Pump') {
          rAlpha *= 0.2;
          pumpOff = 0.35 * Math.sin(Math.PI * f);
          leftPos = G.leftGrip.clone().add(new THREE.Vector3(0, 0, pumpOff));
        } else if (ga.kind === 'Shell') {
          rAlpha *= 0.6;
          const port = new THREE.Vector3(0.0, -0.2, -0.1);
          const k = Math.sin(Math.PI * f);
          leftPos = G.leftGrip.clone().lerp(port.add(new THREE.Vector3(0, -0.4 * (1 - k), 0)), k);
        }
      }
    }
    if (G.mag) {
      G.mag.position.copy(G.magRest).add(magOff);
      G.mag.visible = magVisible;
    }
    if (G.pump) G.pump.position.z = -0.85 + pumpOff;
    if (G.bolt) G.bolt.position.z = 0.05 + boltOff;

    // ---- track (gun lowered)
    let drop = 0;
    let trackW = 0;
    let rT = new THREE.Vector3();
    let lT = new THREE.Vector3();
    let meleeSwing = 0;
    let slashW = 0;
    let slashPose = Pose.of(0, 0, 0, 0, 0, 0);
    const tr = this.track;
    if (tr) {
      tr.t += dt;
      const f = Math.min(tr.t / tr.T, 1);
      if (tr.kind === 'Throw') {
        drop = Math.sin(Math.PI * Math.min(1, f * 1.15)) * 0.9;
        trackW = drop;
        const wind = f < 0.55 ? ease(seg(f, 0, 0.55)) : 1 - ease(seg(f, 0.55, 0.8));
        lT = new THREE.Vector3(-0.9 + 0.5 * (1 - wind), -0.5 + 0.9 * wind, -1.0 + 1.1 * wind);
        rT = new THREE.Vector3(0.6, -1.4, -0.9);
        if (f > 0.55) lT = new THREE.Vector3(-0.2, -0.3, -2.0 + seg(f, 0.55, 1));
      } else if (tr.kind === 'Plate') {
        drop = Math.min(1, f * 6, (1 - f) * 6);
        trackW = drop;
        const k = ease(seg(f, 0.2, 0.75));
        lT = new THREE.Vector3(-0.5 + 0.2 * k, -0.9 + 0.1 * k, -1.6 + 0.5 * k);
        rT = new THREE.Vector3(0.4 - 0.1 * k, -0.95, -1.5 + 0.4 * k);
      } else if (tr.kind === 'Melee') {
        meleeSwing = Math.sin(Math.PI * f);
      } else if (tr.kind === 'Slash') {
        // knife slash: blade sweeps from the right across to the left
        slashW = Math.sin(Math.PI * f);
        slashPose = Pose.of(0.9 - 1.9 * ease(f), -0.35, -1.7, deg(8), deg(55 - 110 * ease(f)), deg(-60 + 120 * ease(f)));
      } else if (tr.kind === 'Stab') {
        // knife stab: pull back, then thrust straight ahead
        const wind = ease(seg(f, 0, 0.35));
        const thrust = ease(seg(f, 0.35, 0.55));
        slashW = f < 0.35 ? wind * 0.5 : 0.5 + 0.5 * thrust * (1 - ease(seg(f, 0.7, 1)));
        slashPose = Pose.of(0.2, -0.2 + 0.1 * wind, -0.3 - 1.9 * thrust + 0.4 * wind * (1 - thrust), deg(-4), deg(-8), deg(-12));
      }
      if (this.item) {
        this.item.position.copy(tr.kind === 'Plate' ? lT.clone().lerp(rT, 0.5).add(new THREE.Vector3(0, 0.15, -0.1)) : lT.clone().add(new THREE.Vector3(0, 0.15, -0.15)));
        this.item.rotation.set(tr.kind === 'Plate' ? -0.2 : 0.5, 0, 0);
      }
      if (tr.t >= tr.T) this.endTrack();
    }

    // ---- pose blend
    const A = mv.alpha;
    const sightOff = G.sight.clone().negate();
    const adsPose = new Pose(new THREE.Vector3(0, 0, -V.eyeRelief).add(sightOff), new THREE.Quaternion());
    let pose = V.hip.lerp(V.sprint, A.sprint).lerp(V.tac, A.tac).lerp(V.slide, A.slide);
    pose = pose.lerp(adsPose, ads).lerp(V.drop, drop);
    if (slashW > 0) pose = pose.lerp(slashPose, slashW);
    if (meleeSwing > 0) pose = pose.lerp(Pose.of(-0.2, -0.3, -2.0, deg(-10), deg(60), deg(-70)), meleeSwing);

    const wT = Number.isFinite(wallDist) ? THREE.MathUtils.clamp((3.9 - wallDist) / 1.6, 0, 1) : 0;
    this.wall = smooth(this.wall, wT * (1 - ads), 14, dt);
    const w = this.wall;
    const wallPose = Pose.of(-0.15 * w, -0.2 * w, 0.7 * w, deg(30) * w, deg(18) * w, 0);

    const pos = sp.clone().multiplyScalar(adsK).add(mvs.clone().multiplyScalar(adsK)).add(kp.clone().multiplyScalar(0.06)).add(bobPos.multiplyScalar(adsK)).add(new THREE.Vector3(0, breath * adsK, 0));
    const rot = sr.clone().multiplyScalar(adsK).add(kr.clone().multiplyScalar(0.02)).add(bobRot.multiplyScalar(adsK)).add(new THREE.Vector3(0, 0, strafeRoll * adsK));
    const pivot = G.rightGrip;
    const reloadPose = new Pose().lerp(V.reload, rAlpha);
    const gunPose = equipPose
      .mul(new Pose(pos))
      .mul(pose)
      .mul(wallPose)
      .mul(reloadPose)
      .mul(new Pose(pivot.clone()))
      .mul(new Pose(new THREE.Vector3(), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot.x, rot.y, rot.z, 'YXZ'))))
      .mul(new Pose(pivot.clone().negate()));
    gunPose.apply(G.root);

    // ---- hands
    let rightW = gunPose.point(rightPos);
    let leftW = gunPose.point(leftPos);
    if (trackW > 0) {
      rightW = rightW.lerp(rT, trackW);
      leftW = leftW.lerp(lT, trackW);
    }
    if (this.cfg && (this.cfg.cls === 'Pistol' || this.cfg.cls === 'Revolver') && !ga) {
      leftW = gunPose.point(G.leftGrip.clone().add(new THREE.Vector3(-0.05, -0.02, 0.02)));
    }
    this.camera.updateMatrixWorld();
    this.solveArm(0, V.rShoulder, V.rHint, rightW, gunPose.q);
    this.solveArm(1, V.lShoulder, V.lHint, leftW, gunPose.q);

    G.root.updateMatrixWorld();
    this.rig.updateMatrix();
    this.muzzleWorld.copy(G.muzzle).applyMatrix4(G.root.matrix).applyMatrix4(this.rig.matrix);
  }
}
