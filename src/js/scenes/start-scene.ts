import { Scene, GameObjects, Math, BlendModes } from "phaser";

import TweenPoser from "../game-objects/components/tween-poser";
import { gameCenter } from "../game-dimensions";
import DEPTHS from "../game-objects/depths";
import PauseMenu from "../game-objects/hud/pause-menu";
import TextButton, { BUTTON_EVENTS } from "../game-objects/hud/text-button";
import SoundManager from "../game-objects/sound-manager";
import store from "../store/index";
import { AUDIO_KEYS, SCENE_NAME } from "./index";

type SpotlightPoses = "Left" | "Right";
type CloudPoses = "Left" | "Right";

export default class StartScene extends Scene {
  // UI Elements
  private titleText: GameObjects.Text;
  private playButton: TextButton;
  private settingsButton: TextButton;
  private pauseMenu: PauseMenu;

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
    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    const bgHeight = height
    const bgWidth = bgHeight * 6 / 4

    this.bg = this.add
      .rectangle(0, 0, bgWidth, bgHeight, 0x222730)
      .setPosition(gameCenter.x, gameCenter.y)
      .setDepth(DEPTHS.BOARD);

    // Cloud Sprite and Animation
    this.cloud_01 = this.add
      .sprite(gameCenter.x + Math.RND.between(300, 400), Math.RND.between(40, 120), "intro", "cloud-1")
      .setScale(0.75)
      .setAlpha(0.95)
      .setDepth(DEPTHS.ABOVE_GROUND);
    this.cloud_01_poser = new TweenPoser(this, this.cloud_01, {
      duration: 60 * 5 * 1000 + Math.RND.between(200, 800),
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
      .sprite(gameCenter.x - Math.RND.between(300, 400), Math.RND.between(40, 120), "intro", "cloud-2")
      .setScale(0.65)
      .setAlpha(0.90)
      .setDepth(DEPTHS.ABOVE_GROUND);
    this.cloud_02_poser = new TweenPoser(this, this.cloud_02, {
      duration: 60 * 5 * 1000 + Math.RND.between(200, 800),
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
      .sprite(gameCenter.x + 250, gameCenter.y, "intro", "light")
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
      .sprite(gameCenter.x + 180, gameCenter.y, "intro", "light")
      .setOrigin(0.95, 0.5)
      .setScale(0.65)
      .setRotation(Math.DegToRad(startingRotationDeg2))
      .setBlendMode(BlendModes.ADD)
      .setAlpha(0.40)
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
      .sprite(gameCenter.x, gameCenter.y, "intro", "bg")
      .setScale(0.9)
      .setDepth(DEPTHS.ABOVE_PLAYER);

    // Hero Sprite and Frames
    this.hero = this.add
      .sprite(524, gameCenter.y, "intro", "hero_01")
      .setScale(0.9)
      .setDepth(DEPTHS.HUD);
    this.anims.create({
      key: `intro-hero`,
      frames: this.anims.generateFrameNames("intro", {
        prefix: `hero_`,
        start: 1,
        end: 12,
        zeroPad: 2,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.hero.play("intro-hero");

    // Title
    this.titleText = this.add
      .text(width / 2, height - 312, "Rogue Sweeper", {
        fontSize: "50px",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.HUD);

    // Play Button
    this.playButton = new TextButton(this, width / 2, height - 224, "Start");
    this.playButton.events.once(BUTTON_EVENTS.DOWN, () => {
      this.sound.stopAll();
      this.scene.stop();
      this.scene.start(SCENE_NAME.MAIN);
    });

    // Create the Pause Menu, to be used by the settings button.
    this.pauseMenu = new PauseMenu(this, store);

    // Settings Button
    const settingsButton = new TextButton(this, width / 2, height - 148, "Settings");
    this.settingsButton = settingsButton;
    settingsButton.events.once(BUTTON_EVENTS.DOWN, () => {
      store.setPauseMenuOpen(true);
    });

    /* Add sound fx needed for the main menu. */
    this.sfx = new SoundManager(this, store);
    this.sfx.playMusic(AUDIO_KEYS.MAIN_MENU_MUSIC);
  }

  destroy() {
    // Cleanup the UI.
    this.playButton.destroy();
    this.settingsButton.destroy();
    this.titleText.destroy();
    this.pauseMenu.destroy();

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
  }
}
