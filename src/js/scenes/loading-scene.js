import Phaser from "phaser";
import { SCENE_NAME } from "./index";

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
    this.load.tilemapTiledJSON("level-1", "maps/lvl-1.json");
    this.load.tilemapTiledJSON("level-2", "maps/lvl-2.json");
    this.load.tilemapTiledJSON("level-3", "maps/lvl-3.json");
    this.load.tilemapTiledJSON("level-4", "maps/lvl-4.json");
    this.load.tilemapTiledJSON("level-5", "maps/lvl-5.json");
  }

  create() {
    this.scene.start(SCENE_NAME.ISO);
  }
}
