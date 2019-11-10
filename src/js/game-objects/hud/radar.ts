import Phaser from "phaser";
import Tile from "../level/tile";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import globalLogger from "../../helpers/logger";
import Player from "../player";
import Level from "../level/level";

class Radar {
  private scene: Phaser.Scene;
  private player: Player;
  private level: Level;
  private outlineGraphics: Phaser.GameObjects.Graphics;
  private labelGraphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private labelTween: Phaser.Tweens.Tween;
  private enemyCount: number = 0;
  private isScrambling = false;
  private scrambledEnemyCount: number = 0;
  private x: number = 0;
  private y: number = 0;
  private w: number = 0;
  private h: number = 0;
  private padding = 2.5;
  private reusableRect = new Phaser.Geom.Rectangle();
  private proxy = new EventProxy();
  private scrambleDangerCountTimer: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.level = null;
    this.outlineGraphics = scene.add.graphics({
      fillStyle: { color: 0xfc3f3f },
      lineStyle: { color: 0xfc3f3f, width: 6 }
    });
    this.labelGraphics = scene.add.graphics({ fillStyle: { color: 0xfc3f3f } });
    this.labelGraphics.fillCircle(0, 0, 24);
    this.text = scene.add
      .text(0, 0, "0", {
        fontSize: 28,
        fontStyle: "bold",
        color: "#fff"
      })
      .setOrigin(0.5);

    this.outlineGraphics.setDepth(DEPTHS.ABOVE_GROUND);
    this.labelGraphics.setDepth(DEPTHS.ABOVE_PLAYER);
    this.text.setDepth(DEPTHS.ABOVE_PLAYER);

    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  getEnemyCount() {
    return this.enemyCount;
  }

  setLevel(level: Level) {
    this.level = level;
  }

  setVisible(isVisible: boolean) {
    this.outlineGraphics.setVisible(isVisible);
    this.labelGraphics.setVisible(isVisible);
    this.text.setVisible(isVisible);
  }

  private updateShapeFromTiles(tiles: Tile[], shouldAnimateUpdate = true): Promise<void> {
    return new Promise(resolve => {
      if (tiles.length === 0) {
        globalLogger.error("Attempted to set the radar shape from an empty array of tiles.");
        return;
      }

      // Calculate the bounds of the set of tiles in world space
      let minX: number = Number.MAX_SAFE_INTEGER;
      let maxX: number = Number.MIN_SAFE_INTEGER;
      let minY: number = Number.MAX_SAFE_INTEGER;
      let maxY: number = Number.MIN_SAFE_INTEGER;
      tiles.map(tile => {
        const { left, right, top, bottom } = tile.getBounds(this.reusableRect);
        if (left < minX) minX = left;
        if (right > maxX) maxX = right;
        if (top < minY) minY = top;
        if (bottom > maxY) maxY = bottom;
      });
      const x = minX - this.padding;
      const y = minY - this.padding;
      const w = maxX - minX + this.padding * 2;
      const h = maxY - minY + this.padding * 2;

      if (this.x == x && this.y == y && this.w == w && this.h == h) {
        resolve();
        return;
      }

      if (shouldAnimateUpdate) {
        const tmp = { x: this.x, y: this.y, w: this.w, h: this.h };
        this.scene.add.tween({
          targets: tmp,
          x,
          y,
          w,
          h,
          duration: 175,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onUpdate: () => this.updateShape(tmp.x, tmp.y, tmp.w, tmp.h),
          onComplete: () => resolve()
        });
      } else {
        this.updateShape(x, y, w, h);
        resolve();
      }
    });
  }

  private updateShape(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.text.setPosition(x + w / 2, y + h);
    this.outlineGraphics.setPosition(x, y);
    this.labelGraphics.setPosition(x + w / 2, y + h);
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.outlineGraphics.clear();
      this.outlineGraphics.strokeRoundedRect(0, 0, w, h);
    }
  }

  private setDangerCount(shouldAnimateUpdate: boolean): Promise<void> {
    const count = this.isScrambling ? this.scrambledEnemyCount : this.enemyCount;
    return new Promise(resolve => {
      if (!shouldAnimateUpdate) {
        this.text.setText(`${count}`);
        resolve();
      } else {
        const target = { value: 1 };
        let hasFlipped = false;
        if (this.labelTween) this.labelTween.stop();
        this.labelTween = this.scene.tweens.add({
          targets: target,
          value: -1,
          duration: 250,
          ease: Phaser.Math.Easing.Quadratic.Out,
          onUpdate: () => {
            if (target.value > 0) {
              const scale = target.value;
              this.text.scaleY = scale;
              this.labelGraphics.scaleY = scale;
            } else {
              if (!hasFlipped) {
                hasFlipped = true;
                this.text.setText(`${count}`);
              }
              const scale = -1 * target.value;
              this.text.scaleY = scale;
              this.labelGraphics.scaleY = scale;
            }
          },
          onComplete: () => resolve()
        });
      }
    });
  }

  /**
   * Scramble the count of enemies near the player, and the color of the radar.
   */
  private startScrambleRadar() {
    this.isScrambling = true;
    if (this.scrambleDangerCountTimer) this.scrambleDangerCountTimer.remove(false);
    this.scrambleDangerCountTimer = this.scene.time.addEvent({
      delay: 250,
      loop: true,
      callback: () => {
        let newEnemyCount;
        do {
          newEnemyCount = Phaser.Math.RND.integerInRange(0, 9);
        } while (newEnemyCount === this.scrambledEnemyCount);
        this.scrambledEnemyCount = newEnemyCount;
        this.setDangerCount(false);
      },
      callbackScope: this
    });

    this.labelGraphics.fillStyle(0xe3c220);
    this.labelGraphics.fill();
    this.outlineGraphics.lineStyle(2, 0xe3c220);
    this.outlineGraphics.stroke();
  }

  /**
   * Stop scrambling the count of enemies near the player and the color of the radar.
   */
  private stopScrambleRadar() {
    this.isScrambling = false;
    if (this.scrambleDangerCountTimer) this.scrambleDangerCountTimer.remove(false);

    this.labelGraphics.fillStyle(0xfc3f3f);
    this.labelGraphics.fill();
    this.outlineGraphics.lineStyle(6, 0xfc3f3f);
    this.outlineGraphics.stroke();
  }

  /**
   * Updates the radar's shape and label. This should be called once, after the player has finished
   * an action like attacking or moving.
   *
   * @returns {Promise<[void, void]>}
   */
  update(): Promise<[void, void]> {
    if (!this.level) return;
    const { x, y } = this.player.getGridPosition();
    this.enemyCount = this.level.countNeighboringEnemies(x, y);
    const inRangeOfScrambleEnemy = this.level.isNeighboringScrambleEnemy(x, y);
    if (inRangeOfScrambleEnemy && !this.isScrambling) {
      this.startScrambleRadar();
    } else if (!inRangeOfScrambleEnemy && this.isScrambling) {
      this.stopScrambleRadar();
    }
    const tiles = this.level.getNeighboringTiles(x, y);
    const p1 = this.updateShapeFromTiles(tiles, true);
    const p2 = this.setDangerCount(true);
    return Promise.all([p1, p2]);
  }

  destroy() {
    if (this.labelTween) this.labelTween.destroy();
    if (this.scrambleDangerCountTimer) this.scrambleDangerCountTimer.remove(false);
    this.scene = undefined;
    this.outlineGraphics.destroy();
    this.labelGraphics.destroy();
    this.text.destroy();
    this.proxy.removeAll();
  }
}

export default Radar;
