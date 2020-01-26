import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";

export default class InventoryMenu {
  private scene: Phaser.Scene;
  private text: Phaser.GameObjects.Text;
  private icons: Phaser.GameObjects.Image[];

  private background: Phaser.GameObjects.Shape;
  private container: Phaser.GameObjects.Container;

  private mobxProxy: MobXProxy;
  private eventProxy: EventProxy;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;

    this.text = scene.add
      .text(0, 0, "Stash", { fontSize: 20, fill: "#000000", fontStyle: "bold" })
      .setOrigin(0.5, 0);

    this.icons = [
      scene.add.image(0, 0, "all-assets", "key"),
      scene.add.image(0, 0, "all-assets", "compass"),
      scene.add.image(0, 0, "all-assets", "marker-2")
    ];

    const activeIconAlpha = 1.0;
    const inactiveIconAlpha = 0.32;
    const iconSpacing = 6;
    const iconHeight = this.icons[0].height;
    const bgPadding = { x: 4, y: 25 };
    const bgWidth = 96;

    this.text.setPosition(bgWidth / 2, bgPadding.y);

    const iconStartY = this.text.y + this.text.height + 15;
    this.icons.forEach((icon, i) => {
      icon.setOrigin(0.5, 0);
      icon.alpha = inactiveIconAlpha;
      icon.x = bgWidth / 2;
      icon.y = iconStartY + (iconHeight + iconSpacing) * i;
    });

    const bgHeight = this.icons[2].y + iconHeight + bgPadding.y;
    this.background = scene.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.435), [this.background, this.text, ...this.icons])
      .setDepth(DEPTHS.HUD);

    this.mobxProxy = new MobXProxy();
    this.mobxProxy.observe(gameStore, "hasKey", () => {
      const alpha = gameStore.hasKey ? activeIconAlpha : inactiveIconAlpha;
      this.icons[0].alpha = alpha;
    });
    this.mobxProxy.observe(gameStore, "hasCompass", () => {
      const alpha = gameStore.hasCompass ? activeIconAlpha : inactiveIconAlpha;
      this.icons[1].alpha = alpha;
    });
    // this.mobxProxy.observe(gameStore, "hasShield", () => {
    //   const alpha = gameStore.hasCompass ? activeIconAlpha :inactiveIconAlpha;
    //   this.icons[2].alpha = alpha;
    // });

    this.eventProxy = new EventProxy();
    this.eventProxy.on(scene.events, "shutdown", this.destroy, this);
    this.eventProxy.on(scene.events, "destroy", this.destroy, this);
  }

  destroy() {
    this.mobxProxy.destroy();
    this.text.destroy();
    this.eventProxy.removeAll();
  }
}
