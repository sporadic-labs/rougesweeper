import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";

export default class DangerIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = this.scene.game.config.width / 2;
    this.text = scene.add.text(x, 525, "", { fontSize: 25 }).setOrigin(0.5, 0.5);

    this.updateText(gameStore.dangerCount, true);
    this.dispose = autorun(() => this.updateText(gameStore.dangerCount));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(dangerCount) {
    this.text.setText(`Danger: ${dangerCount}`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
