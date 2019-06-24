import DEPTHS from "../depths";

export default class CoinCollectAnimation {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y) {
    this.scene = scene;

    this.sprite = scene.add
      .sprite(0, 0, "assets", "tiles/gold")
      .setOrigin(0.5, 0.5)
      .setScale(0.5);
    this.sprite.setDepth(DEPTHS.ABOVE_PLAYER);
    this.sprite.setVisible(false);

    this.setPosition(x, y);
  }

  setPosition(x, y) {
    const cx = x + this.sprite.width / 2;
    this.sprite.x = cx;
    this.sprite.y = y;
  }

  play() {
    return new Promise(resolve => {
      this.sprite.setVisible(true);
      this.timeline = this.scene.tweens
        .createTimeline()
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
        })
        .on("complete", resolve)
        .play();
    });
  }

  destroy() {
    if (this.timeline) this.timeline.destroy();
    this.sprite.destroy();
  }
}
