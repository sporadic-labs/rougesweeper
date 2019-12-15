import DEPTHS from "../depths";

export default class AttackAnimation {
  /**
   * @param {Phaser.Scene} scene
   * @param {string} key
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, key, x, y) {
    this.scene = scene;

    this.sprite = scene.add.sprite(0, 0, "all-assets", key).setOrigin(0.5, 0.5);
    this.sprite.setDepth(DEPTHS.ABOVE_PLAYER);
    this.sprite.setVisible(false);

    this.setPosition(x, y);
  }

  fadeout(delay = 0) {
    setTimeout(() => {
      this.sprite.setVisible(true);
    }, delay);
    return new Promise((resolve, reject) => {
      this.scene.tweens.add({
        targets: this.sprite,
        alpha: 0,
        duration: 600,
        delay: delay,
        ease: "Quad.easeOut",
        onComplete: resolve,
        callbackScope: this
      });
    });
  }

  setPosition(x, y) {
    const cx = x + this.sprite.width / 2;
    this.sprite.x = cx;
    this.sprite.y = y;
  }

  destroy() {
    this.scene.tweens.killTweensOf(this.text);
    this.sprite.destroy();
  }
}
