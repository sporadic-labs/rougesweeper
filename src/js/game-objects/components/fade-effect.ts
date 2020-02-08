import Phaser, { Types, Tweens } from "phaser";

export default class FadeEffect {
  private tween: Tweens.Tween;

  constructor(
    private scene: Phaser.Scene,
    private target: any,
    private startAlpha: number,
    private endAlpha: number,
    private duration: number,
    private additionalTweenConfig?: Types.Tweens.TweenBuilderConfig | object
  ) {}

  setToStart() {
    this.target.setAlpha(this.startAlpha);
  }

  setToEnd() {
    this.target.setAlpha(this.endAlpha);
  }

  fadeIn(additionalTweenConfig?: Types.Tweens.TweenBuilderConfig | object) {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.target,
      alpha: this.startAlpha,
      duration: this.duration,
      ...this.additionalTweenConfig,
      ...additionalTweenConfig
    });
  }

  fadeOut(additionalTweenConfig?: Types.Tweens.TweenBuilderConfig | object) {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.target,
      alpha: this.endAlpha,
      duration: this.duration,
      ...this.additionalTweenConfig,
      ...additionalTweenConfig
    });
  }

  destroy() {
    if (this.tween) this.tween.stop();
  }
}
