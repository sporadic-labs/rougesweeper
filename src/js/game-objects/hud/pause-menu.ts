import { GameObjects, Scene } from "phaser";

import constants from "../../constants";
import { addUIPanel } from "../../helpers/add-ui-panel";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import { SCENE_NAME } from "../../scenes";
import { GameStore } from "../../store/index";
import storedSettings from "../../store/stored-settings";
import DEPTHS from "../depths";
import GAME_MODES from "../game-manager/game-modes";
import SoundManager from "../sound-manager";
import TextButton from "./text-button";

const baseTextStyle = {
  color: constants.darkText,
};
const titleStyle = {
  ...baseTextStyle,
  align: "center",
  fontSize: "30px",
  fontStyle: "bold",
};
const subtitleStyle = {
  ...baseTextStyle,
  align: "center",
  fontSize: "24px",
  fontStyle: "bold",
};
const textStyle = {
  ...baseTextStyle,
  fontSize: "22px",
};

export default class PauseMenu {
  private mobProxy: MobXProxy;
  private proxy: EventProxy;
  private container: GameObjects.Container;
  private isOpen = false;

  // Menu UI
  private title: GameObjects.Text;
  private text: GameObjects.Text;
  private closeButton: TextButton;
  private quitButton: TextButton;

  private musicVolumeLabel: GameObjects.Text;
  private musicVolumeValue: GameObjects.Text;
  private musicVolumeUpButton: TextButton;
  private musicVolumeDownButton: TextButton;
  private sfxVolumeLabel: GameObjects.Text;
  private sfxVolumeValue: GameObjects.Text;
  private sfxVolumeUpButton: TextButton;
  private sfxVolumeDownButton: TextButton;

  constructor(private scene: Scene, private gameStore: GameStore, private sound: SoundManager) {
    this.createModal();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-P",
      () => {
        if (this.isOpen) this.close();
        else if (gameStore.gameState !== GAME_MODES.MENU_MODE) gameStore.setPauseMenuOpen(true);
      },
      this
    );

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "pauseMenuOpen", () => {
      if (gameStore.pauseMenuOpen) this.open();
      this.resetButtons();
    });
  }

  /** Create the menu. */
  private createModal() {
    if (this.container) {
      this.container.destroy();
    }

    const height = Number(this.scene.game.config.height);
    const width = Number(this.scene.game.config.width);
    const modalWidth = width * 0.5;
    const textWidth = modalWidth * 0.7;
    const modalHeight = height * 0.5;
    const textHeight = modalHeight * 0.7;

    this.text = this.scene.add
      .text(0, 0, "", textStyle)
      .setOrigin(0.5, 0.5)
      .setLineSpacing(6)
      .setFixedSize(textWidth, textHeight)
      .setWordWrapWidth(textWidth)
      .setText("Configure the game to your exact specifications!");

    // Derive the modal height from the text height plus some buffer around it
    // for the title and buttons.
    const r = new Phaser.Geom.Rectangle(
      (width - modalWidth) / 2,
      (height - modalHeight) / 2,
      modalWidth,
      modalHeight
    );

    const background = this.scene.add.graphics();
    background.fillStyle(0x000000, 0.25);
    background.fillRect(0, 0, width, height);

    this.text.setPosition(r.centerX, r.centerY);

    const uiPanel = addUIPanel({
      scene: this.scene,
      x: r.x,
      y: r.y,
      width: modalWidth,
      height: modalHeight,
      shadow: "dialogue",
      offset: 20,
      safeUsageOffset: 20,
    });

    // Menu Stuff
    this.title = this.scene.add.text(r.centerX, r.y + 40, "Pause", titleStyle).setOrigin(0.5, 0.5);

    const closeButton = new TextButton(
      this.scene,
      r.centerX - 180,
      r.bottom - 30,
      "Resume",
      {
        origin: { x: 0.5, y: 1 },
      },
      this.sound
    );
    closeButton.events.on("DOWN", this.close);
    this.closeButton = closeButton;

    const quitButton = new TextButton(
      this.scene,
      r.centerX + 180,
      r.bottom - 30,
      "Exit",
      {
        origin: { x: 0.5, y: 1 },
      },
      this.sound
    );
    quitButton.events.on("DOWN", this.quit);
    this.quitButton = quitButton;

    // Music Controls
    this.musicVolumeLabel = this.scene.add
      .text(r.centerX, r.centerY - 90, "Music Volume", subtitleStyle)
      .setOrigin(0.5, 0.5);
    this.musicVolumeValue = this.scene.add
      .text(r.centerX, r.centerY - 40, `${storedSettings.musicVolume}`, subtitleStyle)
      .setOrigin(0.5, 0.5);

    const musicVolumeUpButton = new TextButton(
      this.scene,
      r.centerX + 120,
      r.centerY - 40,
      "+",
      {
        origin: { x: 0.5, y: 0.5 },
      },
      this.sound
    );
    musicVolumeUpButton.events.on("DOWN", this.musicVolumeUp);
    this.musicVolumeUpButton = musicVolumeUpButton;

    const musicVolumeDownButton = new TextButton(
      this.scene,
      r.centerX - 120,
      r.centerY - 40,
      "-",
      {
        origin: { x: 0.5, y: 0.5 },
      },
      this.sound
    );
    musicVolumeDownButton.events.on("DOWN", this.musicVolumeDown);
    this.musicVolumeDownButton = musicVolumeDownButton;

    // SFX Controls
    this.sfxVolumeLabel = this.scene.add
      .text(r.centerX, r.centerY + 40, "SFX Volume", subtitleStyle)
      .setOrigin(0.5, 0.5);
    this.sfxVolumeValue = this.scene.add
      .text(r.centerX, r.centerY + 90, `${storedSettings.sfxVolume}`, subtitleStyle)
      .setOrigin(0.5, 0.5);

    const sfxVolumeUpButton = new TextButton(
      this.scene,
      r.centerX + 120,
      r.centerY + 90,
      "+",
      {
        origin: { x: 0.5, y: 0.5 },
      },
      this.sound
    );
    sfxVolumeUpButton.events.on("DOWN", this.sfxVolumeUp);
    this.sfxVolumeUpButton = sfxVolumeUpButton;

    const sfxVolumeDownButton = new TextButton(
      this.scene,
      r.centerX - 120,
      r.centerY + 90,
      "-",
      {
        origin: { x: 0.5, y: 0.5 },
      },
      this.sound
    );
    sfxVolumeDownButton.events.on("DOWN", this.sfxVolumeDown);
    this.sfxVolumeDownButton = sfxVolumeDownButton;

    // NOTE(rex): What else...?

    this.container = this.scene.add
      .container(0, 0, [
        background,
        uiPanel,
        this.title,
        this.text,
        this.musicVolumeLabel,
        this.musicVolumeValue,
        this.musicVolumeUpButton.text,
        this.musicVolumeDownButton.text,
        this.sfxVolumeLabel,
        this.sfxVolumeValue,
        this.sfxVolumeUpButton.text,
        this.sfxVolumeDownButton.text,
        closeButton.text,
        quitButton.text,
      ])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);
  }

  open = (): void => {
    this.isOpen = true;
    this.container.setVisible(true);
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
  };

  close = (): void => {
    this.isOpen = false;
    this.container.setVisible(false);
    this.gameStore.setPauseMenuOpen(false);
    // NOTE(rex): Going to the previous state would sometimes cause us issues, so I am just going to explicitly set us back to idle mode.
    this.gameStore.setGameState(GAME_MODES.IDLE_MODE);
  };

  restart = (): void => {
    this.isOpen = false;
    this.container.setVisible(false);
    this.gameStore.setPauseMenuOpen(false);
    this.gameStore.setGameState(GAME_MODES.IDLE_MODE);
  };

  quit = (): void => {
    this.gameStore.setPauseMenuOpen(false);
    this.gameStore.goToPreviousGameState();
    this.gameStore.setGameState(GAME_MODES.IDLE_MODE);

    // If we are quitting, go back to the main menu!
    this.scene.scene.stop();
    this.scene.scene.start(SCENE_NAME.START);
  };

  musicVolumeUp = (): void => {
    this.gameStore.musicVolumeUp();
    this.musicVolumeValue.setText(`${this.gameStore.musicVolume}`);
  };

  musicVolumeDown = (): void => {
    this.gameStore.musicVolumeDown();
    this.musicVolumeValue.setText(`${this.gameStore.musicVolume}`);
  };

  sfxVolumeUp = (): void => {
    this.gameStore.sfxVolumeUp();
    this.sfxVolumeValue.setText(`${this.gameStore.sfxVolume}`);
  };

  sfxVolumeDown = (): void => {
    this.gameStore.sfxVolumeDown();
    this.sfxVolumeValue.setText(`${this.gameStore.sfxVolume}`);
  };

  /** Manually call this when closing menu because of bug where button stays in pressed state */
  resetButtons() {
    this.closeButton.reset();
    this.quitButton.reset();
  }

  destroy() {
    this.container.destroy();
    this.proxy.removeAll();
    this.mobProxy.destroy();
  }
}
