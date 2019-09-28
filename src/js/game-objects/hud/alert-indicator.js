import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";

export default class AlertIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.text = scene.add
      .text(fractionToX(0.1), fractionToY(0.82), "", { fontSize: 25 })
      .setOrigin(0.5, 0.5);

    this.updateText(gameStore.playerHealth, true);
    this.dispose = autorun(() => this.updateText(gameStore.playerHealth));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(playerHealth) {
    this.text.setText(`Alert: ${3 - playerHealth}/3`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
