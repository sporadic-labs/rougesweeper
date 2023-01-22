import { Scene, GameObjects } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { AUDIO_KEYS, SCENE_NAME, addAudio } from "./index";
import DEPTHS from "../game-objects/depths";

export default class StartScene extends Scene {
  private titleText: GameObjects.Text;
  private playButton: TextButton;
  private settingsButton: TextButton;
  private background: GameObjects.Sprite;

  create() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;

    const backgroundSprite = this.add
      .sprite(width / 2, y - 100, "start-screen")
      .setScale(2) // TODO(rex): Just make the screens the right size...
      .setDepth(DEPTHS.BOARD)
      .setOrigin(0.5, 0.5);
    this.background = backgroundSprite;

    const gameOverText = this.add
      .text(width / 2, height - 312, "Rogue Sweeper", {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.HUD);
    this.titleText = gameOverText;

    const playButton = new TextButton(this, width / 2, height - 224, "Start");
    this.playButton = playButton;

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.sound.stopAll();
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });

    const settingsButton = new TextButton(this, width / 2, height - 148, "Settings");
    this.settingsButton = settingsButton;

    settingsButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.sound.stopAll();
      this.scene.stop();
      this.scene.start(SCENE_NAME.SETTINGS);
    });

    /* Add sound fx needed for the main menu. */
    addAudio(this);

    this.sound.play(AUDIO_KEYS.MAIN_MENU_MUSIC);
  }

  destroy() {
    this.sound.destroy();
    this.background.destroy();
    this.playButton.destroy();
    this.settingsButton.destroy();
    this.titleText.destroy();
  }
}
