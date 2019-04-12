import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";

export default class HealthIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = 124;
    this.text = scene.add
      .text(x, 600, "", { fontSize: 25 })
      .setOrigin(0.5, 0.5);

    this.updateText(gameStore.playerHealth, true);
    this.dispose = autorun(() => this.updateText(gameStore.playerHealth));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(playerHealth) {
    this.text.setText(`Health: ${playerHealth}`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
