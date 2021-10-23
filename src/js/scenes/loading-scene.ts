import Phaser, { Scene } from "phaser";
import { SCENE_NAME } from "./index";
import { loadLevels, loadDialogue } from "../store/levels";

const textStyle = {
  color: "#ffffff",
  align: "center",
  fontSize: "30",
  fontStyle: "bold"
};

export default class LoadingScene extends Scene {
  private text: Phaser.GameObjects.Text;
  preload() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    this.text = this.add
      .text(width / 2, height / 2 + 75, "Loading...", textStyle)
      .setOrigin(0.5, 0);

    const loadingBar = this.add.graphics();
    this.load.on("progress", (value: number) => {
      loadingBar.clear();
      loadingBar.fillStyle(0xffffff, 1);
      loadingBar.fillRect(width / 2 - 375, height / 2 - 25, 750 * value, 50);
      const mod = Phaser.Math.FloorTo(((value * 100) % 3) + 1, 0);
      const text = `Loading${".".repeat(mod)}${mod <= 2 ? " ".repeat(3 - mod) : ""}`;
      this.text.setText(text);
    });

    this.load.on("complete", () => loadingBar.destroy());

    this.load.setPath("resources/");
    this.load.atlas("all-assets", "atlases/all-assets.png", "atlases/all-assets.json");
    loadLevels(this);
    loadDialogue(this);
  }

  create() {
    this.scene.start(SCENE_NAME.MAIN);
  }
}
