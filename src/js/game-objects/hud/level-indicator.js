import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";

export default class LevelIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.text = scene.add.text(0, 0, "", { fontSize: 25 }).setOrigin(0.5, 0.5);

    this.background = scene.add
      .rectangle(0, 0, 200, 200, 0x585e5e)
      .setOrigin(0.5, 0.5);

    this.container = scene.add.container(fractionToX(0.5), fractionToY(0.9), [
      this.background,
      this.text
    ]);

    this.updateText(gameStore.level, true);
    this.dispose = autorun(() => this.updateText(gameStore.level));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(level) {
    this.text.setText(`Level: ${level}`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
