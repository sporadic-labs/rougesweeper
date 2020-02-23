import Phaser, { Types, Tweens } from "phaser";

type TweenBuilderConfig = Types.Tweens.TweenBuilderConfig;
type ValidPoses = string | number | symbol;
type TweenTarget = any | any[];

// Type for possible tween settings, is it possible to enumerate all the possible target values on a
// Phaser's built-in types?
type PoseData =
  | Omit<TweenBuilderConfig, "targets">
  | {
      // Common tween targets on Phaser objects:
      scaleX?: number;
      scaleY?: number;
      x?: number;
      y?: number;
      alpha?: number;

      // Any other tween target:
      [key: string]: any;
      [key: number]: any;
    };

/**
 * TweenPoser is like a stateful tween on a target or targets. You define a series of poses (states)
 * that the target can be in, and then you can tell it to go to any of those states. Note: only one
 * tween is running at a time, so the target is heading to a "FadeIn" pose and then it is
 * interrupted to go to a "FadeOut" pose, "FadeIn" immediately stops wherever it is and "FadeOut"
 * takes over.
 *
 * @example
 * ```typescript
 * type Poses = "ZoomIn" | "ZoomOut";
 * const poser = new TweenPoser<Poses>(scene, sprite, { duration: 100 });
 *
 * // Define individual poses:
 * poser.definePose("ZoomIn", { scaleX: 1.5, scaleY: 1.5 });
 * poser.definePose("ZoomOut", { scaleX: 1, scaleY: 1 });
 *
 * // Or define all in one:
 * poser.definePoses({
 *  ZoomIn: { scaleX: 1.5, scaleY: 1.5 },
 *  ZoomOut: { scaleX: 1, scaleY: 1 },
 * })
 *
 * // Jump to a pose immediately:
 * poser.setToPose("ZoomOut");
 *
 * // Animate to a defined pose:
 * poser.moveToPose("ZoomIn");
 * ```
 */
export default class TweenPoser<PoseType extends ValidPoses> {
  private tweenConfigs: Map<PoseType, TweenBuilderConfig> = new Map();
  private tween?: Tweens.Tween;
  private pose: PoseType | null = null;

  /**
   * @param scene
   * @param target
   * @param baseConfig The base tween config to use for all the poses. E.g. you could define the
   * duration or ease here and it would apply to all pose transitions.
   */
  constructor(
    private scene: Phaser.Scene,
    private target: TweenTarget,
    private baseConfig: PoseData = {}
  ) {}

  definePoses(poses: Record<PoseType, PoseData>) {
    for (const key in poses) {
      this.tweenConfigs.set(key, { targets: this.target, ...this.baseConfig, ...poses[key] });
    }
  }

  /**
   * Define a pose that can be tweened to.
   * @param pose
   * @param poseConfig Tween config for this pose. If the baseConfig and the pose config share a
   * setting, the pose config will override the base.
   */
  definePose(pose: PoseType, poseConfig: PoseData = {}) {
    this.tweenConfigs.set(pose, { targets: this.target, ...this.baseConfig, ...poseConfig });
    return this;
  }

  /**
   * Transition to a pre-defined pose.
   * @param pose
   * @param configOverrides Any tween settings that you want to override for this particular
   * transition. Precedence of settings is: configOverrides > poseConfig > baseConfig.
   */
  moveToPose(pose: PoseType, configOverrides: PoseData = {}) {
    this.tween?.stop();
    const config = this.getPoseConfig(pose);
    this.tween = this.scene.add.tween({ ...config, ...configOverrides });
    this.pose = pose;
    return this;
  }

  /**
   * Set target(s) immediately to the specified pose.
   * @param pose
   * @param configOverrides Any tween settings that you want to override for this particular
   * transition. Precedence of settings is: configOverrides > poseConfig > baseConfig.
   */
  setToPose(pose: PoseType, configOverrides: PoseData = {}) {
    this.tween?.stop();
    const config = this.getPoseConfig(pose);
    this.tween = this.scene.add.tween({ ...config, ...configOverrides, duration: 0 });
    this.pose = pose;
    return this;
  }

  getCurrentPose(): PoseType | null {
    return this.pose;
  }

  private getPoseConfig(pose: PoseType) {
    const config = this.tweenConfigs.get(pose);
    if (!config) throw new Error(`No registered tween state named: ${pose}`);
    return config;
  }

  destroy() {
    this.tween?.stop();
  }
}
