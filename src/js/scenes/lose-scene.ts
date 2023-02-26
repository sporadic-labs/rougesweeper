import { Scene, GameObjects } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { AUDIO_KEYS, SCENE_NAME, addAudio } from "./index";
import store from "../store/index";
import DEPTHS from "../game-objects/depths";

export default class LoseScene extends Scene {
  private didPlayerWin = false;
  private gameOverText: GameObjects.Text;
  private moveCountText: GameObjects.Text;
  private enemiesDefeatedText: GameObjects.Text;
  private goldText: GameObjects.Text;
  private playButton: TextButton;
  private mainMenuButton: TextButton;
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
      .setScale(2) // TODO(rex): Just make the screens the right size...
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

    const playButton = new TextButton(this, width / 2, y + 164, "Play Again?");
    this.playButton = playButton;

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });

    const mainMenuButton = new TextButton(this, width / 2, y + 240, "Main Menu");
    this.mainMenuButton = mainMenuButton;

    mainMenuButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.START);
    });

    /* Add sound fx needed for the main menu. */
    addAudio(this);

    this.sound.play(AUDIO_KEYS.MAIN_MENU_MUSIC);
  }

  destroy() {
    this.sound.stopAll();
    this.sound.destroy();
    this.mainMenuButton.destroy();
    this.playButton.destroy();
    this.gameOverText.destroy();
    this.moveCountText.destroy();
    this.enemiesDefeatedText.destroy();
    this.goldText.destroy();
    this.background.destroy();
  }
}
