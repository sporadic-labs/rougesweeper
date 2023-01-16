import Phaser from "phaser";
import EventProxy from "../../helpers/event-proxy";
import constants from "../../constants";

export default class DebugTips {
  scene: Phaser.Scene;
  proxy: EventProxy;
  text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.text = this.scene.add
      .text(
        10,
        scene.scale.height - 10,
        "Debug Tips\nToggle tips - Zero\nLevel Select - Space\nAdd ammo - Z",
        {
          color: constants.lightText,
          fontSize: "12px",
        }
      )
      .setOrigin(0, 1);

    this.proxy = new EventProxy();
    this.proxy.on(
      scene.input.keyboard,
      "keydown-ZERO",
      () => this.text.setVisible(!this.text.visible),
      this
    );
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  destroy() {
    this.proxy.removeAll();
    this.text.destroy();
  }
}
