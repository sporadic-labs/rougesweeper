import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/events";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import { levelKeys } from "../../store/levels";

const baseTextStyle = {
  align: "center",
  fill: "#ffffff"
};
const titleStyle = {
  ...baseTextStyle,
  fontSize: 30,
  fontStyle: "bold"
};

export default class DebugMenu {
  scene: Phaser.Scene;
  gameStore: GameStore;
  restartLevelButton: TextButton;
  proxy: EventProxy;
  container: Phaser.GameObjects.Container;
  previousGameState: GAME_MODES;
  isOpen: boolean = false;

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

    const leaveButton = new TextButton(scene, r.centerX, r.bottom - 30, "Close", {
      origin: { x: 0.5, y: 1 }
    });
    leaveButton.events.on("DOWN", this.close);

    const cols = 2;
    const levelSelectButtons = levelKeys.map((name, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const y = r.y + 100 + row * 50;
      const x = r.x + 70 + col * 300;
      const button = new TextButton(scene, x, y, `${name}`, {
        origin: { x: 0, y: 0 }
      });
      button.events.on("DOWN", () => {
        this.close();
        console.log("setting level to " + i);
        gameStore.setLevelByIndex(i);
      });
      return button;
    });

    this.container = scene.add
      .container(0, 0, [
        background,
        title,
        leaveButton.text,
        ...levelSelectButtons.map(b => b.text)
      ])
      .setDepth(DEPTHS.HUD)
      .setVisible(false);

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown_D",
      () => {
        if (this.isOpen) this.close();
        else this.open();
      },
      this
    );
  }

  restartLevel() {}

  open = () => {
    this.isOpen = true;
    this.container.setVisible(true);
    this.resetButtons();
    this.previousGameState = this.gameStore.gameState;
    this.gameStore.setGameState(GAME_MODES.IDLE_MODE);
  };

  close = () => {
    this.isOpen = false;
    this.container.setVisible(false);
    this.gameStore.setGameState(this.previousGameState);
  };

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
  }

  destroy() {
    this.container.destroy();
    this.proxy.removeAll();
  }
}
