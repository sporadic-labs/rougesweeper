import { Math as PMath } from "phaser";
import PathTween from "./path-tween";
import DEPTHS from "../depths";

export default class Player {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.add
      .sprite(x, y, "assets", "player")
      .setScale(1.25, 1.25)
      .setOrigin(0.5, 0.7)
      .setAlpha(0)
      .setDepth(DEPTHS.PLAYER);

    this.moveSpeedMs = 80 / 150; // px/ms, where moving 1 tile = 80px
    this.gridX = 0;
    this.gridY = 0;
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  async movePlayerAlongPath(points) {
    const start = points[0];
    const end = points[points.length - 1];
    const dist = PMath.Distance.Between(start.x, start.y, end.x, end.y);
    const duration = dist / this.moveSpeedMs;
    this.pathTween = new PathTween(
      this.scene,
      points,
      ({ x, y }) => this.sprite.setPosition(x, y),
      { duration, ease: "Quad.easeOut" }
    );
    return this.pathTween.play();
  }

  movePlayerTo(x, y, moveInstantly = false) {
    return new Promise(resolve => {
      if (this.moveTween) this.moveTween.stop();
      if (moveInstantly) {
        this.setPosition(x, y);
        resolve();
      } else {
        const dist = PMath.Distance.Between(this.sprite.x, this.sprite.y, x, y);
        const duration = dist / this.moveSpeedMs;
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

  /**
   * Fade the Player out, destroy it, and resolve a promise when the whole mess is done!
   */
  fadePlayerOut() {
    return new Promise(resolve => {
      if (this.fadeTween) this.fadeTween.stop();
      this.fadeTween = this.scene.add.tween({
        targets: this.sprite,
        alpha: 0,
        y: "-=50",
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 400,
        onComplete: () => {
          return resolve();
        }
      });
    });
  }

  /**
   * Fade the Player out, destroy it, and resolve a promise when the whole mess is done!
   */
  fadePlayerIn() {
    return new Promise(resolve => {
      if (this.fadeTween) this.fadeTween.stop();
      this.fadeTween = this.scene.add.tween({
        targets: this.sprite,
        alpha: 1,
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 400,
        onComplete: () => {
          return resolve();
        }
      });
    });
  }

  destroy() {
    if (this.moveTween) this.moveTween.stop();
    if (this.pathTween) this.pathTween.stop();
    if (this.fadeTween) this.fadeTween.stop();
    this.sprite.destroy();
  }
}
