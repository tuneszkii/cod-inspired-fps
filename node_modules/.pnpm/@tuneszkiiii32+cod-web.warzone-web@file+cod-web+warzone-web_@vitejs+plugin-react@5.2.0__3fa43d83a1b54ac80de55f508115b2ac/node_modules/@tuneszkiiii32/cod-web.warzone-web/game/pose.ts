import * as THREE from 'three';

/**
 * Rigid transform (position + rotation) — a minimal stand-in for Roblox `CFrame`.
 */
export class Pose {
  /**
   * @param p position
   * @param q rotation
   */
  constructor(public p = new THREE.Vector3(), public q = new THREE.Quaternion()) {}

  /**
   * Builds a pose like `CFrame.new(x,y,z) * CFrame.Angles(rx,ry,rz)` (angles in radians).
   * @param x position x
   * @param y position y
   * @param z position z
   * @param rx rotation about X
   * @param ry rotation about Y
   * @param rz rotation about Z
   * @returns new pose
   */
  static of(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) {
    return new Pose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'XYZ')));
  }

  /** @returns a copy */
  clone() {
    return new Pose(this.p.clone(), this.q.clone());
  }

  /**
   * this * other (apply `other` in this pose's local space).
   * @param o other pose
   * @returns new composed pose
   */
  mul(o: Pose) {
    return new Pose(o.p.clone().applyQuaternion(this.q).add(this.p), this.q.clone().multiply(o.q));
  }

  /**
   * Transforms a local point into this pose's parent space.
   * @param v local point
   * @returns transformed point
   */
  point(v: THREE.Vector3) {
    return v.clone().applyQuaternion(this.q).add(this.p);
  }

  /**
   * Interpolates toward another pose.
   * @param o target pose
   * @param t alpha 0..1
   * @returns new pose
   */
  lerp(o: Pose, t: number) {
    return new Pose(this.p.clone().lerp(o.p, t), this.q.clone().slerp(o.q, t));
  }

  /**
   * Writes this pose into an Object3D.
   * @param obj target object
   */
  apply(obj: THREE.Object3D) {
    obj.position.copy(this.p);
    obj.quaternion.copy(this.q);
  }
}
