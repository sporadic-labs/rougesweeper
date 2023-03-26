import { Scene, GameObjects, Math } from "phaser";

import { gameCenter } from "../game-dimensions";
import DEPTHS from "../game-objects/depths";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import TweenPoser from "../game-objects/components/tween-poser";
import SoundManager from "../game-objects/sound-manager";
import store from "../store/index";
import { AUDIO_KEYS, SCENE_NAME } from "./index";

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
  private dino: GameObjects.Sprite;

  // Sound Effects
  private sfx: SoundManager;

  create() {
    /* Add sound fx needed for the main menu. */
    this.sfx = new SoundManager(this, store);

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);
    const y = height / 2;

    const bgHeight = height;
    const bgWidth = (bgHeight * 6) / 4;

    this.bg = this.add
      .rectangle(0, 0, bgWidth, bgHeight, 0x88a4b7)
      .setPosition(gameCenter.x, gameCenter.y)
      .setDepth(DEPTHS.BOARD);

    this.volcano = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "background")
      .setScale(0.9)
      .setDepth(DEPTHS.ABOVE_GROUND);

    this.midground = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "midground")
      .setScale(0.9)
      .setDepth(DEPTHS.BELOW_PLAYER);

    this.foreground = this.add
      .sprite(gameCenter.x, gameCenter.y, "win", "foreground")
      .setScale(0.9)
      .setDepth(DEPTHS.ABOVE_PLAYER);

    this.smoke = this.add
      .sprite(gameCenter.x, 0, "win", "smoke_01")
      .setScale(0.9)
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
      frameRate: 6,
      repeat: -1,
    });

    this.smoke.play("win-smoke");

    this.dino = this.add
      .sprite(500, gameCenter.y, "dino", "dino_01")
      .setScale(0.36)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.PLAYER);
    this.anims.create({
      key: `win-dino`,
      frames: this.anims.generateFrameNames("dino", {
        prefix: `dino_`,
        start: 1,
        end: 18,
        zeroPad: 2,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.dino.play("win-dino");

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

    const playButton = new TextButton(this, width / 2, y + 164, "Play Again?", {}, this.sfx);
    this.playButton = playButton;

    playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });

    const mainMenuButton = new TextButton(this, width / 2, y + 240, "Main Menu", {}, this.sfx);
    this.mainMenuButton = mainMenuButton;

    mainMenuButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.scene.stop();
      this.scene.start(SCENE_NAME.START);
    });

    // Start playing the background music.
    this.sfx.playMusic(AUDIO_KEYS.MAIN_MENU_MUSIC);
  }

  destroy() {
    // Cleanup the Sprites...
    this.bg.destroy();
    this.volcano.destroy();
    this.midground.destroy();
    this.foreground.destroy();
    this.smoke.destroy();
    this.dino.destroy();

    // Cleanup the Audio.
    this.sfx.destroy();

    this.mainMenuButton.destroy();
    this.playButton.destroy();
    this.gameOverText.destroy();
    this.moveCountText.destroy();
    this.enemiesDefeatedText.destroy();
    this.goldText.destroy();
    this.background.destroy();
  }
}
