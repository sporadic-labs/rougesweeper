import Phaser from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { SCENE_NAME } from "./index";
import store from "../store/index";

export default class GameOverScene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    const { width, height } = this.game.config;
    let y = height / 2;
    const gameOverText = this.add
      .text(width / 2, y - 75, "Game Over!", { fontSize: 50 })
      .setOrigin(0.5, 0.5);
    const goldText = this.add
      .text(width / 2, y, `Gold Collected: ${store.goldCount}`, { fontSize: 50 })
      .setOrigin(0.5, 0.5);
    const playButton = new TextButton(this, width / 2, y + 75, "Play Again?");

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });
  }
}
