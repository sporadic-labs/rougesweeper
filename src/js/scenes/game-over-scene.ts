import { Scene, GameObjects } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { SCENE_NAME } from "./index";
import store from "../store/index";
import DEPTHS from "../game-objects/depths";

export default class GameOverScene extends Scene {
  private didPlayerWin = false;
  private gameOverText: GameObjects.Text;
  private moveCountText: GameObjects.Text;
  private enemiesDefeatedText: GameObjects.Text;
  private goldText: GameObjects.Text;
  private playButton: TextButton;
  private background: GameObjects.Sprite;

  init(data: { didPlayerWin: boolean }) {
    this.didPlayerWin = data.didPlayerWin;
  }

  create() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;

    const backgroundSprite = this.add
      .sprite(width / 2, y - 100, this.didPlayerWin ? "win-screen" : "lose-screen")
      .setScale(1.6) // TODO(rex): Just make the screens the right size...
      .setDepth(DEPTHS.BOARD)
      .setOrigin(0.5, 0.5);
    this.background = backgroundSprite;

    const gameOverText = this.add
      .text(width / 2, y - 100, this.didPlayerWin ? "You Win!" : "Game Over!", {
        fontSize: "50px",
      })
      .setDepth(DEPTHS.HUD)
      .setOrigin(0.5, 0.5);
    this.gameOverText = gameOverText;

    const moveCountText = this.add
      .text(width / 2, y - 40, `Moves: ${store.moveCount}`, {
        fontSize: "50px",
      })
      .setDepth(DEPTHS.HUD)
      .setOrigin(0.5, 0.5);
    this.moveCountText = moveCountText;

    const enemiesDefeatedText = this.add
      .text(width / 2, y + 20, `Enemies Defeated: ${store.enemiesDefeated}`, {
        fontSize: "50px",
      })
      .setDepth(DEPTHS.HUD)
      .setOrigin(0.5, 0.5);
    this.enemiesDefeatedText = enemiesDefeatedText;

    const goldText = this.add
      .text(width / 2, y + 80, `Tech Collected: ${store.goldCount}`, {
        fontSize: "50px",
      })
      .setDepth(DEPTHS.HUD)
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
    this.background.destroy();
  }
}
