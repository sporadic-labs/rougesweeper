import Phaser from "phaser";
import { SCENE_NAME } from "./index.js";
import { loadLevels, loadDialogue } from "../store/levels";

export default class LoadingScene extends Phaser.Scene {
  preload() {
    const loadingBar = this.add.graphics();
    this.load.on("progress", value => {
      loadingBar.clear();
      loadingBar.fillStyle(0xffffff, 1);
      loadingBar.fillRect(0, 750 / 2 - 25, 750 * value, 50);
    });
    this.load.on("complete", () => loadingBar.destroy());

    this.load.setPath("resources/");
    this.load.atlas("assets", "atlases/assets.png", "atlases/assets.json");
    this.load.atlas("all-assets", "atlases/all-assets.png", "atlases/all-assets.json");
    loadLevels(this);
    loadDialogue(this);
  }

  create() {
    this.scene.start(SCENE_NAME.MAIN);
  }
}
