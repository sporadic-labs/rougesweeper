import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";

const textStyle = {
  fill: "#585e5e",
  align: "center",
  fontSize: 30,
  fontStyle: "bold"
};

export default class TechIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;

    const containerHeight = 120;
    const bgPadding = { x: 4, y: 25 };
    const bgWidth = 96;

    this.sprite = scene.add
      .sprite(bgWidth / 2, bgPadding.y, "assets", "ui/tech-icon")
      .setOrigin(0.5, 0);

    this.text = scene.add
      .text(bgWidth / 2, this.sprite.height + bgPadding.y + 10, "0", textStyle)
      .setOrigin(0.5, 0);

    this.background = scene.add
      .rectangle(0, 0, 96, containerHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.8), [
        this.background,
        this.sprite,
        this.text
      ])
      .setDepth(DEPTHS.HUD);

    this.updateText(gameStore.goldCount, true);
    this.dispose = autorun(() => this.updateText(gameStore.goldCount));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(goldCount) {
    this.text.setText(goldCount);
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
