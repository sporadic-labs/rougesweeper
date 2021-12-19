import { autorun } from "mobx";
import { Scene } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import store, { GameStore } from "../../store/index";

const FRAMES = {
  FULL: "ammo-full",
  EMPTY: "ammo-empty",
};

export default class AmmoIndicator {
  private scene: Phaser.Scene;
  private store: GameStore;
  private text: Phaser.GameObjects.Text;
  private icons: Phaser.GameObjects.Image[];

  private background: Phaser.GameObjects.Shape;
  private container: Phaser.GameObjects.Container;

  private mobxProxy: MobXProxy;
  private eventProxy: EventProxy;

  private dispose: any;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;

    this.text = scene.add
      .text(0, 0, "Ammo", { fontSize: "20px", color: "#000000", fontStyle: "bold" })
      .setOrigin(0.5, 0);

    this.icons = [
      scene.add.image(0, 0, "all-assets", FRAMES.FULL),
      scene.add.image(0, 0, "all-assets", FRAMES.FULL),
      scene.add.image(0, 0, "all-assets", FRAMES.FULL),
      scene.add.image(0, 0, "all-assets", FRAMES.FULL),
      scene.add.image(0, 0, "all-assets", FRAMES.FULL),
    ];

    const iconSpacing = -24;
    const iconHeight = this.icons[0].height;
    const bgPadding = { x: 4, y: 24 };
    const bgWidth = 96;

    this.text.setPosition(bgWidth / 2, bgPadding.y);

    const iconStartY = this.text.y + this.text.height + 15;
    this.icons.forEach((icon, i) => {
      icon.setOrigin(0.5, 0);
      icon.x = bgWidth / 2;
      icon.y = iconStartY + (iconHeight + iconSpacing) * i;
    });

    const bgHeight = this.icons[this.icons.length - 1].y + iconHeight + bgPadding.y;
    this.background = scene.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.03), [this.background, this.text, ...this.icons])
      .setDepth(DEPTHS.HUD);

    this.updateText(gameStore.playerAmmo);
    this.dispose = autorun(() => this.updateText(gameStore.playerAmmo));

    this.eventProxy = new EventProxy();
    this.eventProxy.on(scene.events, "shutdown", this.destroy, this);
    this.eventProxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(playerAmmo: number) {
    const ammoAmount = playerAmmo;
    this.icons.forEach((icon, i) => {
      const frame = i < ammoAmount ? FRAMES.FULL : FRAMES.EMPTY;
      icon.setFrame(frame);
    });
  }

  destroy() {
    this.dispose();
    this.text.destroy();
    this.eventProxy.removeAll();
  }
}