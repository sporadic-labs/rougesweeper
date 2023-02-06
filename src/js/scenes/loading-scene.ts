import Phaser, { Scene } from "phaser";
import { SCENE_NAME, loadAudio } from "./index";
import { loadLevels } from "../store/levels";
import constants from "../constants";

const textStyle = {
  color: constants.lightText,
  align: "center",
  fontSize: "30px",
  fontStyle: "bold",
};

export default class LoadingScene extends Scene {
  private text: Phaser.GameObjects.Text;
  preload() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    // Show the user a userful interface.
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

    // Game Assets
    this.load.setPath("resources/atlases/"); // set the path for the assets
    this.load.atlas("all-assets", "all-assets.png", "all-assets.json");
    
    // Intro Screen
    this.load.setPath("resources/screens/intro/"); // set the path for the screens
    this.load.multiatlas("intro", "intro.json");

    this.load.setPath("resources/screens/"); // set the path for the screens

    this.load.image("win-screen", "game-over-win-v1.png");
    this.load.image("lose-screen", "game-over-lose-v1.png");

    this.load.setPath("resources/"); // reset the path
    
    // SFX
    loadAudio(this);

    // Levels
    loadLevels(this);
  }

  create() {
    this.scene.start(SCENE_NAME.START);
  }
}
