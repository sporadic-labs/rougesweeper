import Phaser, { Scene } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { SCENE_NAME } from "./index";
import store from "../store/index";

export default class GameOverScene extends Scene {
  private didPlayerWin = false;
  private gameOverText: Phaser.GameObjects.Text;
  private moveCountText: Phaser.GameObjects.Text;
  private enemiesDefeatedText: Phaser.GameObjects.Text;
  private goldText: Phaser.GameObjects.Text;
  private playButton: TextButton;

  init(data: { didPlayerWin: boolean }) {
    this.didPlayerWin = data.didPlayerWin;
  }

  create() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;

    const gameOverText = this.add
      .text(width / 2, y - 100, this.didPlayerWin ? "You Win!" : "Game Over!", {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5);
    this.gameOverText = gameOverText;

    const moveCountText = this.add
      .text(width / 2, y - 40, `Moves: ${store.moveCount}`, {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5);
    this.moveCountText = moveCountText;

    const enemiesDefeatedText = this.add
      .text(width / 2, y + 20, `Enemies Defeated: ${store.enemiesDefeated}`, {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5);
    this.enemiesDefeatedText = enemiesDefeatedText;

    const goldText = this.add
      .text(width / 2, y + 80, `Tech Collected: ${store.goldCount}`, {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5);
    this.goldText = goldText;

    const playButton = new TextButton(this, width / 2, y + 160, "Play Again?");
    this.playButton = playButton;

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });
  }

  destroy() {
    this.playButton.destroy();
    this.gameOverText.destroy();
    this.moveCountText.destroy();
    this.enemiesDefeatedText.destroy();
    this.goldText.destroy();
  }
}
