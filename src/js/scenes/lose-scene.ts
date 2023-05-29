import { Scene, GameObjects, Math, BlendModes } from "phaser";

import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import { AUDIO_KEYS, SCENE_NAME, addAudio } from "./index";
import store from "../store/index";
import DEPTHS from "../game-objects/depths";
import TweenPoser from "../game-objects/components/tween-poser";
import { gameCenter, gameWidth } from "../game-dimensions";
import SoundManager from "../game-objects/sound-manager";

type SpotlightPoses = "Left" | "Right";
type CloudPoses = "Left" | "Right";

export default class LoseScene extends Scene {
  private gameOverText: GameObjects.Text;
  private moveCountText: GameObjects.Text;
  private enemiesDefeatedText: GameObjects.Text;
  private goldText: GameObjects.Text;
  private playButton: TextButton;
  private mainMenuButton: TextButton;

  // Intro Screen Animation
  private bg: GameObjects.Rectangle;
  private cloud_01: GameObjects.Sprite;
  private cloud_01_poser: TweenPoser<CloudPoses>;
  private cloud_02: GameObjects.Sprite;
  private cloud_02_poser: TweenPoser<CloudPoses>;
  private spotlight_01: GameObjects.Sprite;
  private spotlight_01_poser: TweenPoser<SpotlightPoses>;
  private spotlight_02: GameObjects.Sprite;
  private spotlight_02_poser: TweenPoser<SpotlightPoses>;
  private buildings: GameObjects.Sprite;
  private hero: GameObjects.Sprite;

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
      .rectangle(0, 0, bgWidth, bgHeight, 0x222730)
      .setPosition(gameCenter.x, gameCenter.y)
      .setDepth(DEPTHS.BOARD);

    // Cloud Sprite and Animation
    this.cloud_01 = this.add
      .sprite(
        gameCenter.x + Math.RND.between(200, 400),
        Math.RND.between(60, 180),
        "lose",
        "cloud_01"
      )
      .setScale(0.75)
      .setAlpha(0.95)
      .setDepth(DEPTHS.ABOVE_GROUND);
    this.cloud_01_poser = new TweenPoser(this, this.cloud_01, {
      duration: 60 * 1000 + Math.RND.between(200, 800),
      yoyo: true,
      hold: Math.RND.between(250, 350),
      repeat: -1,
      repeatDelay: Math.RND.between(250, 350),
    });
    this.cloud_01_poser.definePoses({
      Left: { x: this.cloud_01.width },
      Right: { x: width - this.cloud_01.width },
    });
    this.cloud_01_poser.setToPose("Right");
    this.cloud_01_poser.moveToPose("Left");

    this.cloud_02 = this.add
      .sprite(
        gameCenter.x - Math.RND.between(300, 400),
        Math.RND.between(60, 180),
        "lose",
        "cloud_02"
      )
      .setScale(0.65)
      .setAlpha(0.9)
      .setDepth(DEPTHS.ABOVE_GROUND);
    this.cloud_02_poser = new TweenPoser(this, this.cloud_02, {
      duration: 60 * 1000 + Math.RND.between(200, 800),
      yoyo: true,
      hold: Math.RND.between(250, 350),
      repeat: -1,
      repeatDelay: Math.RND.between(250, 350),
    });
    this.cloud_02_poser.definePoses({
      Left: { x: this.cloud_02.width },
      Right: { x: width - this.cloud_02.width },
    });
    this.cloud_02_poser.setToPose("Right");
    this.cloud_02_poser.moveToPose("Left");

    // Spotlight Sprite and Animation
    const startingRotationDeg1 = Math.RND.between(60, 75);
    this.spotlight_01 = this.add
      .sprite(gameCenter.x + 250, gameCenter.y, "lose", "spotlight")
      .setOrigin(0.95, 0.5)
      .setScale(0.75)
      .setRotation(Math.DegToRad(startingRotationDeg1))
      .setBlendMode(BlendModes.ADD)
      .setAlpha(0.45)
      .setDepth(DEPTHS.BELOW_PLAYER);
    this.spotlight_01_poser = new TweenPoser(this, this.spotlight_01, {
      duration: 6400 + Math.RND.between(1200, 2000),
      yoyo: true,
      hold: Math.RND.between(250, 350),
      repeat: -1,
      repeatDelay: Math.RND.between(250, 350),
    });
    this.spotlight_01_poser.definePoses({
      Left: { rotation: Math.DegToRad(startingRotationDeg1) },
      Right: { rotation: Math.DegToRad(Math.RND.between(90, 120)) },
    });
    this.spotlight_01_poser.setToPose("Left");
    this.spotlight_01_poser.moveToPose("Right");

    const startingRotationDeg2 = Math.RND.between(110, 130);
    this.spotlight_02 = this.add
      .sprite(gameCenter.x + 180, gameCenter.y, "lose", "spotlight")
      .setOrigin(0.95, 0.5)
      .setScale(0.65)
      .setRotation(Math.DegToRad(startingRotationDeg2))
      .setBlendMode(BlendModes.ADD)
      .setAlpha(0.4)
      .setDepth(DEPTHS.BELOW_PLAYER);
    this.spotlight_02_poser = new TweenPoser(this, this.spotlight_02, {
      duration: 7200 + Math.RND.between(1200, 2000),
      yoyo: true,
      hold: Math.RND.between(250, 350),
      repeat: -1,
      repeatDelay: Math.RND.between(250, 350),
    });
    this.spotlight_02_poser.definePoses({
      Left: { rotation: Math.DegToRad(Math.RND.between(50, 65)) },
      Right: { rotation: Math.DegToRad(startingRotationDeg2) },
    });
    this.spotlight_02_poser.setToPose("Right");
    this.spotlight_02_poser.moveToPose("Left");

    // Buildings
    this.buildings = this.add
      .sprite(gameCenter.x, gameCenter.y, "lose", "background")
      .setScale(0.9)
      .setDepth(DEPTHS.ABOVE_PLAYER);

    // Hero Sprite and Frames
    this.hero = this.add
      .sprite((gameWidth - bgWidth) / 2, gameCenter.y, "lose", "character_01")
      .setOrigin(0, 0.5)
      .setScale(0.9)
      .setDepth(DEPTHS.HUD);
    this.anims.create({
      key: `lose-hero`,
      frames: this.anims.generateFrameNames("lose", {
        prefix: `character_`,
        start: 1,
        end: 12,
        zeroPad: 2,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.hero.play("lose-hero");

    const gameOverText = this.add
      .text(width / 2, y - 100, "Game Over!", {
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

    // Start playing the audio!
    this.sfx.playMusic(AUDIO_KEYS.MAIN_MENU_MUSIC);
  }

  destroy() {
    // Cleanup the Sprites...
    this.bg.destroy();
    this.cloud_01.destroy();
    this.cloud_02.destroy();
    this.cloud_01_poser.destroy();
    this.cloud_02_poser.destroy();
    this.spotlight_01.destroy();
    this.spotlight_02.destroy();
    this.spotlight_01_poser.destroy();
    this.spotlight_02_poser.destroy();
    this.buildings.destroy();
    this.hero.destroy();

    // Cleanup the Audio.
    this.sfx.destroy();

    this.mainMenuButton.destroy();
    this.playButton.destroy();
    this.gameOverText.destroy();
    this.moveCountText.destroy();
    this.enemiesDefeatedText.destroy();
    this.goldText.destroy();
  }
}
