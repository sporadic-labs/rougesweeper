import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";

export default class PurseIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = this.scene.game.config.width - 100;
    this.text = scene.add
      .text(x, 600, "", { fontSize: 25 })
      .setOrigin(0.5, 0.5);

    this.updateText(gameStore.goldCount, true);
    this.dispose = autorun(() => this.updateText(gameStore.goldCount));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(goldCount) {
    this.text.setText(`Gold: ${goldCount}`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
