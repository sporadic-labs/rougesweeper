import Phaser from "phaser";
import BezierEasing from "bezier-easing";
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
  private areaGraphic: Phaser.GameObjects.Graphics;
  private labelBackgroundSprite: Phaser.GameObjects.Sprite;
  private labelContainer: Phaser.GameObjects.Container;
  private text: Phaser.GameObjects.Text;
  private labelTween: Phaser.Tweens.Tween;
  private enemyCount: number = 0;
  private isScrambling = false;
  private scrambledEnemyCount: number = 0;
  private x: number = 0;
  private y: number = 0;
  private w: number = 0;
  private h: number = 0;
  private padding = 5;
  private isOpen = false;
  private reusableRect = new Phaser.Geom.Rectangle();
  private proxy = new EventProxy();
  private scrambleDangerCountTimer: Phaser.Time.TimerEvent;
  private openTween: Phaser.Tweens.Tween;
  private labelHoverTween: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, player: Player) {
    this.scene = scene;
    this.player = player;
    this.level = null;
    this.areaGraphic = scene.add.graphics({
      fillStyle: { color: 0xfc3f3f, alpha: 0.25 }
    });
    this.labelBackgroundSprite = scene.add
      .sprite(0, 0, "all-assets", "radar-pin")
      .setOrigin(0.5, 1);
    this.text = scene.add
      .text(0, 0, "0", {
        fontSize: 29,
        fontStyle: "bold",
        color: "#fff"
      })
      .setOrigin(0.5, 0.5);
    this.text.y = -this.labelBackgroundSprite.displayHeight * (22 / 38);
    this.labelContainer = scene.add.container(0, 0, [this.labelBackgroundSprite, this.text]);
    this.labelContainer.setAlpha(0.8);

    this.areaGraphic.setDepth(DEPTHS.ABOVE_GROUND);
    this.labelContainer.setDepth(DEPTHS.ABOVE_PLAYER);

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
    this.areaGraphic.setVisible(isVisible);
    this.labelContainer.setVisible(isVisible);
  }

  private async updateShapeFromTiles(tiles: Tile[], shouldAnimateUpdate = true): Promise<void> {
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
    const w = maxX - minX + this.padding * 2;
    const h = maxY - minY + this.padding * 2;
    const x = minX + w / 2 - this.padding;
    const y = minY + h / 2 - this.padding;

    if (this.x == x && this.y == y && this.w == w && this.h == h) return;

    if (shouldAnimateUpdate) {
      this.updateShape(x, y, w, h);
      if (this.isOpen) await this.closeRadar();
      await this.openRadar();
    } else {
      this.updateShape(x, y, w, h);
    }
  }

  closeRadar(): Promise<void> {
    if (this.isOpen) {
      this.isOpen = false;
      return new Promise(resolve => {
        this.openTween?.stop();
        this.openTween = this.scene.add.tween({
          targets: [this.labelContainer, this.areaGraphic],
          scaleX: 0,
          scaleY: 0,
          duration: 150,
          ease: Phaser.Math.Easing.Circular.Out,
          onComplete: () => resolve()
        });
      });
    }
  }

  private openRadar(): Promise<void> {
    if (!this.isOpen) {
      this.isOpen = true;
      return new Promise(resolve => {
        this.openTween?.stop();
        this.openTween = this.scene.add.tween({
          targets: [this.labelContainer, this.areaGraphic],
          scaleX: 1,
          scaleY: 1,
          duration: 300,
          ease: BezierEasing(0.31, 0.68, 0.02, 1.47), // https://cubic-bezier.com/#.17,.67,.83,.67
          onComplete: () => resolve()
        });
      });
    }
  }

  private updateShape(x: number, y: number, w: number, h: number) {
    this.x = x;
    this.y = y;
    this.areaGraphic.setPosition(x, y);
    const labelPos = this.player.getTopCenter();
    this.labelContainer.setPosition(labelPos.x, labelPos.y + 4);
    this.labelHoverTween?.stop();
    this.labelHoverTween = this.scene.add.tween({
      targets: this.labelContainer,
      y: labelPos.y - 4,
      duration: 500,
      yoyo: true,
      repeat: -1,
      easing: Phaser.Math.Easing.Bounce.InOut
    });
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.redrawAreaGraphic();
    }
  }

  private redrawAreaGraphic() {
    this.areaGraphic.clear();
    this.areaGraphic.fillRoundedRect(-this.w / 2, -this.h / 2, this.w, this.h);
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
              this.labelContainer.scaleY = scale;
            } else {
              if (!hasFlipped) {
                hasFlipped = true;
                this.text.setText(`${count}`);
              }
              const scale = -1 * target.value;
              this.labelContainer.scaleY = scale;
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

    this.labelBackgroundSprite.setFrame("radar-pin-scrambled");

    this.areaGraphic.fillStyle(0xe3c220, 0.25);
    this.redrawAreaGraphic();
  }

  /**
   * Stop scrambling the count of enemies near the player and the color of the radar.
   */
  private stopScrambleRadar() {
    this.isScrambling = false;
    if (this.scrambleDangerCountTimer) this.scrambleDangerCountTimer.remove(false);

    this.labelBackgroundSprite.setFrame("radar-pin");

    this.areaGraphic.fillStyle(0xfc3f3f, 0.25);
    this.redrawAreaGraphic();
  }

  /**
   * Updates the radar's shape and label. This should be called once, after the player has finished
   * an action like attacking or moving.
   *
   * @returns {Promise<[void, void]>}
   */
  async update(): Promise<[void, void]> {
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
    const playerTile = this.level.getTileFromGrid(x, y);
    if (playerTile) tiles.push(playerTile);
    const p1 = this.updateShapeFromTiles(tiles, true);
    const p2 = this.setDangerCount(true);
    return Promise.all([p1, p2]);
  }

  destroy() {
    this.openTween?.stop();
    if (this.labelTween) this.labelTween.stop();
    if (this.scrambleDangerCountTimer) this.scrambleDangerCountTimer.remove(false);
    this.scene = undefined;
    this.areaGraphic.destroy();
    this.labelContainer.destroy();
    this.proxy.removeAll();
  }
}

export default Radar;
