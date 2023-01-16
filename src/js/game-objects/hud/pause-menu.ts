import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import TextButton from "./text-button";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import constants from "../../constants";
import { SCENE_NAME } from "../../scenes";

const baseTextStyle = {
  align: "center",
  color: constants.lightText,
  fontSize: "20px",
};
const titleStyle = {
  ...baseTextStyle,
  fontSize: "30px",
  fontStyle: "bold",
};

export default class PauseMenu {
  scene: Phaser.Scene;
  gameStore: GameStore;
  mobProxy: MobXProxy;
  proxy: EventProxy;
  container: Phaser.GameObjects.Container;
  isOpen = false;
  closeButton: TextButton;
  quitButton: TextButton;

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.gameStore = gameStore;

    const width = Number(scene.game.config.width);
    const height = Number(scene.game.config.height);
    const modalWidth = width - 100;
    const modalHeight = 0.6 * height;

    const r = new Phaser.Geom.Rectangle((width - modalWidth) / 2, 50, modalWidth, modalHeight);
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.5);
    background.fillRect(0, 0, width, height);
    background.fillStyle(0x000000);
    background.fillRect(r.x, r.y, r.width, r.height);

    const title = scene.add.text(r.centerX, r.y + 25, "Pause Menu", titleStyle).setOrigin(0.5, 0);

    const text = scene.add
      .text(r.centerX, r.centerY, "TODO: Put a pause menu in...", baseTextStyle)
      .setOrigin(0.5, 0);

    const quitButton = new TextButton(scene, r.centerX, r.bottom - 100, "Quit", {
      origin: { x: 0.5, y: 1 },
    });
    quitButton.events.on("DOWN", this.quit);
    this.quitButton = quitButton;

    const closeButton = new TextButton(scene, r.centerX, r.bottom - 30, "Close", {
      origin: { x: 0.5, y: 1 },
    });
    closeButton.events.on("DOWN", this.close);
    this.closeButton = closeButton;

    this.container = scene.add
      .container(0, 0, [background, title, text, quitButton.text, closeButton.text])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);

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

  quit = (): void => {
    this.gameStore.setPauseMenuOpen(false);
    this.gameStore.goToPreviousGameState();
    this.gameStore.setGameState(GAME_MODES.IDLE_MODE);

    // If we are quitting, go back to the main menu!
    this.scene.scene.stop();
    this.scene.scene.start(SCENE_NAME.START);
  };

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
    this.closeButton.reset();
  }

  destroy() {
    this.container.destroy();
    this.proxy.removeAll();
  }
}
