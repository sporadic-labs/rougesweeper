export default class Player {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    this.sprite = scene.add.sprite(x, y, "assets", "player");
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  destroy() {
    this.sprite.destroy();
  }
}
