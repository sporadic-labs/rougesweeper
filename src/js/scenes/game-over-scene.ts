import Phaser, { Scene } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { SCENE_NAME } from "./index";
import store from "../store/index";

export default class GameOverScene extends Scene {
  private didPlayerWin = false;

  init(data: { didPlayerWin: boolean }) {
    this.didPlayerWin = data.didPlayerWin;
  }

  create() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;
    const gameOverText = this.add
      .text(width / 2, y - 90, this.didPlayerWin ? "You Win!" : "Game Over!", {
        fontSize: 50
      })
      .setOrigin(0.5, 0.5);
    const goldText = this.add
      .text(width / 2, y - 30, `Moves: ${store.moveCount}`, {
        fontSize: 50
      })
      .setOrigin(0.5, 0.5);
    const moveCountText = this.add
      .text(width / 2, y + 30, `Tech Collected: ${store.goldCount}`, {
        fontSize: 50
      })
      .setOrigin(0.5, 0.5);
    const playButton = new TextButton(this, width / 2, y + 90, "Play Again?");

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });
  }
}
