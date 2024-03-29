import { autorun } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { levelData as allLevelData } from "../../store/levels";

const textStyle = {
  fill: "#ffffff",
  align: "center",
  fontSize: 26,
  fontStyle: "bold",
};
export default class LevelIndicator {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.text = scene.add.text(0, 0, "", textStyle).setOrigin(0.5, 0.5);

    this.background = scene.add.rectangle(0, 0, 240, 72, 0x585e5e).setOrigin(0.5, 0.5);

    this.container = scene.add
      .container(fractionToX(0.5), fractionToY(0.953), [this.background, this.text])
      .setDepth(DEPTHS.HUD);

    this.updateText(gameStore.level, true);
    this.dispose = autorun(() => this.updateText(gameStore.level));

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateText(level) {
    const levelData = allLevelData.find((data) => data.level === level);
    if (levelData) {
      this.text.setText(`${levelData.title}\n${levelData.subtitle}`);
    }
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
