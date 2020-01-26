import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";

const FRAMES = {
  FILLED: "alarm-on",
  UNFILLED: "alarm-off"
};

export default class AlertIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;

    this.text = scene.add
      .text(0, 0, "Alert", { fontSize: 20, fill: "#000000", fontStyle: "bold" })
      .setOrigin(0.5, 0);

    this.icons = [
      scene.add.image(0, 0, "all-assets", FRAMES.UNFILLED),
      scene.add.image(0, 0, "all-assets", FRAMES.UNFILLED),
      scene.add.image(0, 0, "all-assets", FRAMES.UNFILLED)
    ];

    const iconSpacing = 6;
    const iconHeight = this.icons[0].height;
    const bgPadding = { x: 4, y: 25 };
    const bgWidth = 96;

    this.text.setPosition(bgWidth / 2, bgPadding.y);

    const iconStartY = this.text.y + this.text.height + 15;
    this.icons.forEach((icon, i) => {
      icon.setOrigin(0.5, 0);
      icon.x = bgWidth / 2;
      icon.y = iconStartY + (iconHeight + iconSpacing) * i;
    });

    const bgHeight = this.icons[2].y + iconHeight + bgPadding.y;
    this.background = scene.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.08), [this.background, this.text, ...this.icons])
      .setDepth(DEPTHS.HUD);

    this.updateText(gameStore.playerHealth, true);
    this.dispose = autorun(() => this.updateText(gameStore.playerHealth));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(playerHealth) {
    const alertLevel = 3 - playerHealth;
    this.icons.forEach((icon, i) => {
      const frame = i < alertLevel ? FRAMES.FILLED : FRAMES.UNFILLED;
      icon.setFrame(frame);
    });
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
