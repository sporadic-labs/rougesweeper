import Phaser from "phaser";
import { SCENE_NAME } from "./index.js";
import { loadLevels } from "../store/levels.ts";

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
    loadLevels(this);
  }

  create() {
    this.scene.start(SCENE_NAME.MAIN);
  }
}
