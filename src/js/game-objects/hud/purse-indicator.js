import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";

const textStyle = {
  fill: "#585e5e",
  align: "center",
  fontSize: 30,
  fontStyle: "bold"
};

export default class PurseIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.sprite = scene.add.sprite(0, 0, "assets", `tiles/tile-back`);
    this.text = scene.add.text(0, 0, "0", textStyle).setOrigin(0.5, 0.5);

    this.background = scene.add
      .rectangle(0, 0, 96, 120, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0.5, 0.5);

    this.container = scene.add.container(fractionToX(0.17), fractionToY(0.88), [
      this.background,
      this.sprite,
      this.text
    ]);

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
