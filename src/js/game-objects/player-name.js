import { autorun } from "mobx";
import EventProxy from "../helpers/event-proxy";

export default class PlayerName {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.text = scene.add.text(0, 0, "").setOrigin(0, 0);

    this.dispose = autorun(() => {
      const name = gameStore.playerName;
      this.text.setText(name);
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
