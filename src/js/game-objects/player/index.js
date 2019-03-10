export default class Player {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    this.sprite = scene.add
      .sprite(x, y, "assets", "player")
      .setScale(1.25, 1.25)
      .setDepth(10);

    this.gridX = 0;
    this.gridY = 0;
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }

  destroy() {
    this.sprite.destroy();
  }
}
