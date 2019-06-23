import Phaser from "phaser";
import Tile from "../level/tile";
import { GameStore } from "../../store/index";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";

class Radar {
  private scene: Phaser.Scene;
  private graphics: Phaser.GameObjects.Graphics;
  private text: Phaser.GameObjects.Text;
  private x: number;
  private y: number;
  private w: number;
  private h: number;
  private padding = 2.5;
  private reusableRect = new Phaser.Geom.Rectangle();
  private mobProxy = new MobXProxy();
  private proxy = new EventProxy();

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.graphics = scene.add.graphics().setDepth(100);
    this.text = scene.add
      .text(0, 0, "0", {
        fontSize: 25,
        fontStyle: "bold",
        color: "#fff"
      })
      .setOrigin(0.5)
      .setDepth(100);

    this.mobProxy.observe(gameStore, "dangerCount", () =>
      this.setDangerCount(gameStore.dangerCount)
    );
    this.setDangerCount(gameStore.dangerCount);

    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.x = 10;
    this.y = 0;
    this.w = 225;
    this.h = 225;
    this.redraw();
  }

  setVisible(isVisible: boolean) {
    this.text.setVisible(isVisible);
    this.graphics.setVisible(isVisible);
  }

  setTiles(tiles: Tile[]) {
    if (tiles.length === 0) return;
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

    this.x = minX - this.padding;
    this.y = minY - this.padding;
    this.w = maxX - minX + this.padding * 2;
    this.h = maxY - minY + this.padding * 2;
    this.redraw();
  }

  setDangerCount(count: number) {
    this.text.setText(`${count}`);
  }

  redraw() {
    const { x, y, w, h } = this;
    this.graphics
      .clear()
      .fillStyle(0xfc3f3f)
      .lineStyle(5, 0xfc3f3f);
    this.graphics.strokeRoundedRect(x, y, w, h);
    this.graphics.fillCircle(x + w / 2, y + h, 20);
    this.text.setPosition(x + w / 2, y + h);
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
