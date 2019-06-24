import Phaser from "phaser";
import Tile from "../level/tile";
import { GameStore } from "../../store/index";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import globalLogger from "../../helpers/logger";

class Radar {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;
  private x: number = 0;
  private y: number = 0;
  private w: number = 0;
  private h: number = 0;
  private padding = 2.5;
  private reusableRect = new Phaser.Geom.Rectangle();
  private mobProxy = new MobXProxy();
  private proxy = new EventProxy();

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.graphics = scene.add.graphics();
    this.text = scene.add
      .text(0, 0, "0", {
        fontSize: 25,
        fontStyle: "bold",
        color: "#fff"
      })
      .setOrigin(0.5);
    this.container = scene.add
      .container(0, 0, [this.graphics, this.text])
      .setDepth(DEPTHS.ABOVE_GROUND);

    this.mobProxy.observe(gameStore, "dangerCount", () =>
      this.setDangerCount(gameStore.dangerCount)
    );
    this.setDangerCount(gameStore.dangerCount);

    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  setVisible(isVisible: boolean) {
    this.container.setVisible(isVisible);
  }

  updateShapeFromTiles(tiles: Tile[], shouldAnimateUpdate = true): Promise<void> {
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
          onComplete: resolve
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
    this.container.setPosition(x, y);
    if (w !== this.w || h !== this.h) {
      this.w = w;
      this.h = h;
      this.text.setPosition(w / 2, h);
      this.graphics
        .clear()
        .fillStyle(0xfc3f3f)
        .lineStyle(5, 0xfc3f3f);
      this.graphics.strokeRoundedRect(0, 0, w, h);
      this.graphics.fillCircle(w / 2, h, 20);
    }
  }

  setDangerCount(count: number) {
    this.text.setText(`${count}`);
  }

  destroy() {
    this.scene = undefined;
    this.graphics.destroy();
    this.text.destroy();
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}

export default Radar;
