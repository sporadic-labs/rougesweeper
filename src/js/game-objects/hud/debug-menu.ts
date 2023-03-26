import Phaser, { Scene, GameObjects } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import { levelKeys } from "../../store/levels";
import storedSettings from "../../store/stored-settings";
import MobXProxy from "../../helpers/mobx-proxy";
import constants from "../../constants";
import SoundManager from "../sound-manager";
import { addUIPanel } from "../../helpers/add-ui-panel";

const baseTextStyle = {
  color: constants.darkText,
};
const titleStyle = {
  ...baseTextStyle,
  align: "center",
  fontSize: "30px",
  fontStyle: "bold",
};
const textStyle = {
  ...baseTextStyle,
  fontSize: "22px",
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

  constructor(
    scene: Scene,
    private sound: SoundManager,
    levelName: string,
    top: number,
    left: number
  ) {
    const origin = { origin: { x: 0, y: 0 } };
    let x = 0;
    let y = 0;
    this.label = scene.add.text(x, y, levelName, textStyle);
    y += this.label.height + 5;
    this.loadButton = new TextButton(scene, x, y, "Load", origin, this.sound);
    x += this.loadButton.text.width + 5;
    this.setStartingLevelButton = new TextButton(scene, x, y, "Start Here", origin, this.sound);

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
  showTutorialButton: TextButton;

  private mobxProxy: MobXProxy;

  private title: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gameStore: GameStore, private sound: SoundManager) {
    this.scene = scene;
    this.gameStore = gameStore;

    this.createModal();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-SPACE",
      () => {
        if (this.isOpen) this.close();
        else if (gameStore.gameState !== GAME_MODES.MENU_MODE) this.open();
      },
      this
    );
    this.proxy.on(scene.input.keyboard, "keydown-G", () => gameStore.addGold(), this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-Z",
      () => {
        gameStore.upgradeItems();
        gameStore.addAmmo("hack", 5);
        gameStore.addAmmo("clearRadar", 1);
        gameStore.addAmmo("revealTile", 1);
        gameStore.addAmmo("compass", 1);
      },
      this
    );
    this.proxy.on(scene.input.keyboard, "keydown-X", () => gameStore.addAmmo("hack", 1), this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-C",
      () => gameStore.addAmmo("revealTile", 1),
      this
    );
    this.proxy.on(
      scene.input.keyboard,
      "keydown-V",
      () => gameStore.addAmmo("clearRadar", 1),
      this
    );
    this.proxy.on(scene.input.keyboard, "keydown-B", () => gameStore.addAmmo("compass", 1), this);

    this.mobxProxy = new MobXProxy();
    this.mobxProxy.observe(gameStore, "hasSeenTutorial", () => {
      if (gameStore.hasSeenTutorial) this.showTutorialButton.enableInteractivity();
      else this.showTutorialButton.disableInteractivity();
    });
  }

  /** Create the menu. */
  private createModal() {
    if (this.container) {
      this.container.destroy();
    }

    const height = Number(this.scene.game.config.height);
    const width = Number(this.scene.game.config.width);
    const modalWidth = width * 0.7;
    const textWidth = modalWidth * 0.75;
    const modalHeight = height * 0.6;
    const textHeight = modalHeight * 0.75;

    this.text = this.scene.add
      .text(0, 0, "", textStyle)
      .setOrigin(0.5, 0.5)
      .setLineSpacing(6)
      .setFixedSize(textWidth, textHeight)
      .setWordWrapWidth(textWidth)
      .setText("Debug the game here!");

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

    this.title = this.scene.add
      .text(r.centerX, r.y + 40, "Debug Menu", titleStyle)
      .setOrigin(0.5, 0.5);

    const closeButton = new TextButton(
      this.scene,
      r.centerX - 180,
      r.bottom - 30,
      "Back",
      {
        origin: { x: 0.5, y: 1 },
      },
      this.sound
    );
    closeButton.events.on("DOWN", this.close);
    this.closeButton = closeButton;

    const showTutorialButton = new TextButton(
      this.scene,
      r.centerX + 180,
      r.bottom - 30,
      "Show Tutorial",
      {
        origin: { x: 0.5, y: 1 },
      },
      this.sound
    );
    showTutorialButton.events.on("DOWN", this.showTutorial);
    if (!this.gameStore.hasSeenTutorial) showTutorialButton.disableInteractivity();
    this.showTutorialButton = showTutorialButton;

    const levelSelectButtons = levelKeys.map((name, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);

      const y = r.y + 125 + row * 100;
      const x = r.x + 100 + col * 300;
      const levelButton = new LevelSelectButton(this.scene, this.sound, name, x, y);
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

    this.container = this.scene.add
      .container(0, 0, [
        background,
        uiPanel,
        this.title,
        this.text,
        closeButton.text,
        showTutorialButton.text,
        ...this.levelSelectButtons.map((b) => b.container),
      ])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);
  }

  loadLevel(i: number) {
    this.close();
    // If you are loading the tutorial, reset the weapon state.
    if (i === 0) {
      this.gameStore.removeAllAmmo();
      this.gameStore.setHasWeapon(false);
    }
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

  showTutorial = () => {
    this.gameStore.setHasSeenTutorial(false);
  };

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
    this.levelSelectButtons.forEach((b) => b.reset());
    this.showTutorialButton.reset();
    this.closeButton.reset();
  }

  destroy() {
    this.container.destroy();
    this.proxy.removeAll();
    this.mobxProxy.destroy();
  }
}
