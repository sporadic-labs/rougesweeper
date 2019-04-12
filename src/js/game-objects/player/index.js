import PathTween from "./path-tween";

export default class Player {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add
      .sprite(x, y, "assets", "player")
      .setScale(1.25, 1.25)
      .setOrigin(0.5, 0.7)
      .setDepth(10);

    this.gridX = 0;
    this.gridY = 0;
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  async movePlayerAlongPath(points, duration = 200) {
    const pathTween = new PathTween(
      this.scene,
      points,
      ({ x, y }) => this.sprite.setPosition(x, y),
      { duration, ease: "Quad.easeOut" }
    );
    return pathTween.play();
  }

  movePlayerTo(x, y, duration = 200) {
    return new Promise(resolve => {
      if (this.moveTween) this.moveTween.stop();
      if (duration === 0) {
        this.setPosition(x, y); // Phaser tween bug
        resolve();
      } else {
        this.moveTween = this.scene.tweens.add({
          targets: this.sprite,
          x,
          y,
          duration,
          ease: "Quad.easeOut",
          onComplete: resolve
        });
      }
    });
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
    if (this.moveTween) this.moveTween.stop();
    this.sprite.destroy();
  }
}
