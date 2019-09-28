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

const containerHeight = 120;
const containerPos = fraction => {
  if (fraction > 0.5) {
    return containerHeight * (fraction - 0.5);
  } else {
    return -(containerHeight * (0.5 - fraction));
  }
};

export default class TechIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;

    this.sprite = scene.add
      .sprite(0, containerPos(0.35), "assets", "ui/tech-icon")
      .setOrigin(0.5, 0.5);

    this.text = scene.add
      .text(0, containerPos(0.75), "0", textStyle)
      .setOrigin(0.5, 0.5);

    this.background = scene.add
      .rectangle(0, 0, 96, containerHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0.5, 0.5);

    this.container = scene.add
      .container(fractionToX(0.17), fractionToY(0.88), [
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
