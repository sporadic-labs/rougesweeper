import Phaser, { Scene, GameObjects } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import { levelKeys } from "../../store/levels";
import storedSettings from "../../store/stored-settings";

const baseTextStyle = {
  align: "center",
  color: "#ffffff",
};
const titleStyle = {
  ...baseTextStyle,
  fontSize: "30px",
  fontStyle: "bold",
};

/**
 * Placeholder level select button that looks like this:
 *
 * Level-1-Floor-1
 * [Load] [Start Here]
 */
class LevelSelectButton {
  public label: GameObjects.Text;
  public loadButton: TextButton;
  public setStartingLevelButton: TextButton;
  public container: GameObjects.Container;

  constructor(scene: Scene, levelName: string, top: number, left: number) {
    const origin = { origin: { x: 0, y: 0 } };
    let x = 0;
    let y = 0;
    this.label = scene.add.text(x, y, levelName, {
      align: "left",
      color: "#ffffff",
      fontSize: "25px",
    });
    y += this.label.height + 5;
    this.loadButton = new TextButton(scene, x, y, "Load", origin);
    x += this.loadButton.text.width + 5;
    this.setStartingLevelButton = new TextButton(scene, x, y, "Start Here", origin);

    this.container = scene.add.container(top, left, [
      this.label,
      this.loadButton.text,
      this.setStartingLevelButton.text,
    ]);
  }

  reset() {
    this.loadButton.reset();
    this.setStartingLevelButton.reset();
  }

  destroy() {
    this.container.destroy();
    this.loadButton.destroy();
    this.setStartingLevelButton.destroy();
  }
}

export default class DebugMenu {
  scene: Phaser.Scene;
  gameStore: GameStore;
  proxy: EventProxy;
  container: Phaser.GameObjects.Container;
  isOpen = false;
  levelSelectButtons: LevelSelectButton[];
  closeButton: TextButton;

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

    const title = scene.add.text(r.centerX, r.y + 25, "Debug Menu", titleStyle).setOrigin(0.5, 0);

    const closeButton = new TextButton(scene, r.centerX, r.bottom - 30, "Close", {
      origin: { x: 0.5, y: 1 },
    });
    closeButton.events.on("DOWN", this.close);
    this.closeButton = closeButton;

    const levelSelectButtons = levelKeys.map((name, i) => {
      const level = i + 1;
      const floor = i % 3;
      const col = floor - 1; // Floor starts at 1.
      const row = level - 1; // Level starts at 1.
      const y = r.y + 100 + row * 100;
      const x = r.x + 70 + col * 300;
      const levelButton = new LevelSelectButton(scene, name, x, y);
      levelButton.loadButton.events.on("DOWN", () => {
        this.loadLevel(i);
      });
      levelButton.setStartingLevelButton.events.on("DOWN", () => {
        this.loadLevel(i);
        storedSettings.setStartingLevel(i);
      });
      return levelButton;
    });
    this.levelSelectButtons = levelSelectButtons;

    this.container = scene.add
      .container(0, 0, [
        background,
        title,
        closeButton.text,
        ...this.levelSelectButtons.map((b) => b.container),
      ])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-D",
      () => {
        if (this.isOpen) this.close();
        else if (gameStore.gameState !== GAME_MODES.MENU_MODE) this.open();
      },
      this
    );
    this.proxy.on(scene.input.keyboard, "keydown-G", () => gameStore.addGold(), this);
  }

  loadLevel(i: number) {
    this.close();
    this.gameStore.setLevelByIndex(i);
  }

  open = () => {
    this.isOpen = true;
    this.container.setVisible(true);
    this.resetButtons();
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
  };

  close = () => {
    this.isOpen = false;
    this.container.setVisible(false);
    this.gameStore.goToPreviousGameState();
  };

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
    this.levelSelectButtons.forEach((b) => b.reset());
    this.closeButton.reset();
  }

  destroy() {
    this.container.destroy();
    this.proxy.removeAll();
  }
}
