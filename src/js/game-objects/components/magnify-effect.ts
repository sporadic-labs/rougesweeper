import Phaser, { Types, Tweens } from "phaser";

type TweenBuilderConfigExtension = Omit<Types.Tweens.TweenBuilderConfig, "targets">;

export class MagnifyEffect {
  private tween: Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private target: any,
    private startScale: number,
    private endScale: number,
    private duration: number,
    private additionalTweenConfig?: TweenBuilderConfigExtension
  ) {}

  scaleUp(additionalTweenConfig?: TweenBuilderConfigExtension) {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.target,
      scaleX: this.endScale,
      scaleY: this.endScale,
      duration: this.duration,
      ...this.additionalTweenConfig,
      ...additionalTweenConfig,
    });
  }

  scaleDown(additionalTweenConfig?: TweenBuilderConfigExtension) {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.target,
      scaleX: this.startScale,
      scaleY: this.startScale,
      duration: this.duration,
      ...this.additionalTweenConfig,
      ...additionalTweenConfig,
    });
  }

  destroy() {
    if (this.tween) this.tween.stop();
  }
}
