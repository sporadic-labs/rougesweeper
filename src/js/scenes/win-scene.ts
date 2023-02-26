import { Scene, GameObjects, Math } from "phaser";

import { gameCenter } from "../game-dimensions";
import DEPTHS from "../game-objects/depths";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import TweenPoser from "../game-objects/components/tween-poser";
import SoundManager from "../game-objects/sound-manager";
import store from "../store/index";
import { AUDIO_KEYS, SCENE_NAME, addAudio } from "./index";

type SpotlightPoses = "Left" | "Right";
type CloudPoses = "Left" | "Right";

export default class WinScene extends Scene {
  // UI Elements
  private gameOverText: GameObjects.Text;
  private moveCountText: GameObjects.Text;
  private enemiesDefeatedText: GameObjects.Text;
  private goldText: GameObjects.Text;
  private playButton: TextButton;
  private mainMenuButton: TextButton;
  private background: GameObjects.Sprite;

  // Win Screen Animation
  private bg: GameObjects.Rectangle;
  private volcano: GameObjects.Sprite;
  private midground: GameObjects.Sprite;
  private foreground: GameObjects.Sprite;
  private smoke: GameObjects.Sprite;

  // Sound Effects
  private sfx: SoundManager;

  create() {
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;

    this.bg = this.add
      .rectangle(0, 0, width, height, 0x475465)
      .setPosition(gameCenter.x, gameCenter.y)
      .setDepth(DEPTHS.BOARD);

    this.volcano = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "background")
      .setDepth(DEPTHS.ABOVE_GROUND);

    this.midground = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "midground")
      .setDepth(DEPTHS.BELOW_PLAYER);

    this.foreground = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "foreground")
      .setDepth(DEPTHS.PLAYER);

    this.smoke = this.add
      .sprite(gameCenter.x, -60, "win", "smoke_01")
      .setOrigin(0.5, 0)
      .setDepth(DEPTHS.PLAYER);
    this.anims.create({
      key: `win-smoke`,
      frames: this.anims.generateFrameNames("win", {
        prefix: `smoke_`,
        start: 1,
        end: 12,
        zeroPad: 2,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.smoke.play("win-smoke");

    const gameOverText = this.add
      .text(width / 2, y - 100, "You Win!", {
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
    // Cleanup the Sprites...
    this.bg.destroy();
    this.volcano.destroy();
    this.midground.destroy();
    this.foreground.destroy();
    this.smoke.destroy();

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
