import DEPTHS from "../depths";
import { Scene, GameObjects, Tweens } from "phaser";

export default class CoinCollectAnimation {
  private sprite: GameObjects.Sprite;
  private timeline: Tweens.Timeline;

  constructor(private scene: Scene, x: number, y: number) {
    this.scene = scene;

    this.sprite = scene.add
      .sprite(0, 0, "all-assets", "tech-1")
      .setOrigin(0.5, 0.5)
      .setScale(0.5);
    this.sprite.setDepth(DEPTHS.ABOVE_PLAYER);
    this.sprite.setVisible(false);

    this.timeline = this.scene.tweens.createTimeline();
    this.timeline
      .add({
        targets: this.sprite,
        ease: Phaser.Math.Easing.Quadratic.Out,
        duration: 200,
        scaleX: 1.05,
        scaleY: 1.05,
        y: "-=30"
      })
      .add({
        targets: this.sprite,
        duration: 200,
        ease: Phaser.Math.Easing.Quadratic.In,
        scaleX: 0.5,
        scaleY: 0.5,
        y: "+=30"
      });

    this.setPosition(x, y);
  }

  setPosition(x: number, y: number) {
    const cx = x + this.sprite.width / 2;
    this.sprite.x = cx;
    this.sprite.y = y;
  }

  play() {
    return new Promise(resolve => {
      this.sprite.setVisible(true);
      this.timeline.on("complete", resolve).play();
    });
  }

  destroy() {
    this.timeline.destroy();
    this.sprite.destroy();
  }
}
