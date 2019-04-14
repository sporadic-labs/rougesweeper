import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";

export default class MovesIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = this.scene.game.config.width - 106;
    this.text = scene.add.text(x, 670, "", { fontSize: 25 }).setOrigin(0.5, 0.5);

    this.updateText(gameStore.moveCount, true);
    this.dispose = autorun(() => this.updateText(gameStore.moveCount));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(moveCount) {
    this.text.setText(`Moves: ${moveCount}`);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
