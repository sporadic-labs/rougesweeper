import { Scene, GameObjects } from "phaser";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { SCENE_NAME } from "./index";
import DEPTHS from "../game-objects/depths";

export default class SettingScene extends Scene {
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
      .text(width / 2, height - 312, "Settings", {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.HUD);
    this.titleText = gameOverText;

    const playButton = new TextButton(this, width / 2, height - 172, "Back");
    this.playButton = playButton;

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.START);
    });
  }

  destroy() {
    this.background.destroy();
    this.playButton.destroy();
    this.settingsButton.destroy();
    this.titleText.destroy();
  }
}
