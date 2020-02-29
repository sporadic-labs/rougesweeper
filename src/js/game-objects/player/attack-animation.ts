import DEPTHS from "../depths";
import { Scene, GameObjects, Tweens, Types } from "phaser";

export default class AttackAnimation {
  private sprite: GameObjects.Sprite;
  private tween: Tweens.Tween;

  constructor(private scene: Scene, key: string, x: number, y: number) {
    this.scene = scene;

    this.sprite = scene.add.sprite(0, 0, "all-assets", key).setOrigin(0.5, 0.5);
    this.sprite.setDepth(DEPTHS.ABOVE_PLAYER);
    this.sprite.setVisible(false);
    this.sprite.setAlpha(0);

    this.setPosition(x, y);
  }

  fadeout(delay = 0): Promise<void> {
    setTimeout(() => {
      this.sprite.setVisible(true);
    }, delay);
    return new Promise(resolve => {
      this.tween?.stop();
      this.tween = this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 600,
        delay: delay,
        ease: "Quad.easeOut",
        onComplete: () => resolve,
        callbackScope: this
      });
    });
  }

  setPosition(x: number, y: number) {
    const cx = x + this.sprite.width / 2;
    this.sprite.x = cx;
    this.sprite.y = y;
  }

  destroy() {
    this.tween?.stop();
    this.sprite.destroy();
  }
}
