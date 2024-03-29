import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { GameStore } from "../../store";
import constants from "../../constants";

const textStyle = {
  color: constants.darkText,
  align: "center",
  fontSize: "30px",
  fontStyle: "bold",
};

export default class TechIndicator {
  scene: Phaser.Scene;
  gameStore: GameStore;

  title: Phaser.GameObjects.Text;
  sprite: Phaser.GameObjects.Sprite;
  text: Phaser.GameObjects.Text;
  background: Phaser.GameObjects.Shape;
  container: Phaser.GameObjects.Container;

  proxy: EventProxy;
  private dispose: any;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;

    const bgPadding = { x: 4, y: 25 };
    const bgWidth = 96;
    const iconSpacing = 6;

    this.title = scene.add
      .text(bgWidth / 2, bgPadding.y, "Score", {
        fontSize: "20px",
        color: constants.darkText,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0);

    this.sprite = scene.add
      .sprite(bgWidth / 2, this.title.y + this.title.height + iconSpacing, "all-assets", "tech-1")
      .setOrigin(0.5, 0);

    this.text = scene.add
      .text(bgWidth / 2, this.sprite.y + this.sprite.height + iconSpacing, "0", textStyle)
      .setOrigin(0.5, 0);

    const bgHeight = this.text.y + this.text.height + bgPadding.y;
    this.background = scene.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.8), [
        this.background,
        this.title,
        this.sprite,
        this.text,
      ])
      .setDepth(DEPTHS.HUD);

    this.updateText(gameStore.goldCount);
    this.dispose = autorun(() => this.updateText(gameStore.goldCount));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(goldCount: number) {
    this.text.setText(`${goldCount}`);
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
