import { Math as PMath, Scene, GameObjects, Tweens } from "phaser";
import PathTween from "./path-tween";
import DEPTHS from "../depths";
import { Point } from "../../helpers/common-interfaces";

export default class Player {
  private moveSpeedMs = 80 / 125; // px / ms, where moving 1 tile = 80px
  private sprite: GameObjects.Sprite;
  private gridX = 0;
  private gridY = 0;
  private pathTween: PathTween;
  private moveTween: Tweens.Tween;
  private fadeTween: Tweens.Tween;

  constructor(private scene: Scene, x: number, y: number) {
    this.scene = scene;
    this.sprite = scene.add
      .sprite(x, y, "all-assets", "player-m")
      .setScale(1.25, 1.25)
      .setOrigin(0.5, 0.7)
      .setAlpha(0)
      .setDepth(DEPTHS.PLAYER);
  }

  setPosition(x: number, y: number) {
    this.sprite.setPosition(x, y);
  }

  async movePlayerAlongPath(points: Point[]) {
    let dist = 0;
    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      dist += PMath.Distance.Between(p1.x, p1.y, p2.x, p2.y);
    }
    const duration = dist / this.moveSpeedMs;
    this.pathTween = new PathTween(
      this.scene,
      points,
      ({ x, y }: Point) => {
        this.sprite.setDepth(DEPTHS.BOARD + (y / 75) * 4 + 2);
        this.sprite.setPosition(x, y);
      },
      { duration, ease: "Quad.easeOut" }
    );
    return this.pathTween.play();
  }

  movePlayerTo(x: number, y: number, moveInstantly = false) {
    return new Promise(resolve => {
      if (this.moveTween) this.moveTween.stop();
      this.sprite.setDepth(DEPTHS.BOARD + (y / 75) * 4 + 2);
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

  getTopCenter() {
    return this.sprite.getTopCenter();
  }

  setGridPosition(x: number, y: number) {
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
        duration: 150,
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
    this.setPosition(this.getPosition().x, this.getPosition().y - 50);
    return new Promise(resolve => {
      if (this.fadeTween) this.fadeTween.stop();
      this.fadeTween = this.scene.add.tween({
        targets: this.sprite,
        alpha: 1,
        y: "+=50",
        ease: Phaser.Math.Easing.Quadratic.In,
        duration: 250,
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
