import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";

export default class MovesIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = fractionToX(1) - 200;
    this.text = scene.add.text(x, fractionToY(0.88), "", { fontSize: 25 }).setOrigin(0.5, 0.5);

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
