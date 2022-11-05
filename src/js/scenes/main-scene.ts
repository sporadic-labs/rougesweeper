import { Scene } from "phaser";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import TechIndicator from "../game-objects/hud/tech-indicator";
import AlertIndicator from "../game-objects/hud/alert-indicator";
import PauseToggle from "../game-objects/hud/pause-toggle";
import LevelIndicator from "../game-objects/hud/level-indicator";
import store from "../store/index";
import ToastManager from "../game-objects/hud/toast-manager";
import ItemSwitcher from "../game-objects/hud/item-switcher";
import { addUIPanel } from "../helpers/add-ui-panel";

const titleStyle = {
  align: "left",
  color: "#ffffff",
  fontSize: "30px",
  fontStyle: "bold",
};

export default class MainScene extends Scene {
  create() {
    store.startNewGame();

    const width = Number(this.game.config.width);
    const height = Number(this.game.config.height);

    const player = new Player(this, 0, 0);
    const toastManager = new ToastManager(this);
    const gameManager = new GameManager(this, player, toastManager);
    const gameTitle = this.add
      .text(width * 0.9, height * 0.46, "SpyWare\n(or whatever...)", titleStyle)
      .setOrigin(0.5, 0);

    new TechIndicator(this, store);
    new AlertIndicator(this, store);
    new ItemSwitcher(this, store);
    new PauseToggle(this, store);
    new LevelIndicator(this, store);

    // Example code, remove me when implemented!
    // See this reference: https://github.com/jdotrjs/phaser3-nineslice#2-use-the-plugin-to-make-9-sliced-objects
    // addUIPanel({
    //   scene: this,
    //   x: 25,
    //   y: 100,
    //   width: 500,
    //   height: 200,
    //   shadowOffsetX: 5,
    //   shadowOffsetY: 5,
    //   offset: 20,
    //   safeUsageOffset: 20,
    // }).setDepth(10000000);
    // addUIPanel({
    //   scene: this,
    //   x: 25,
    //   y: 350,
    //   width: 500,
    //   height: 200,
    //   shadowOffsetX: 10,
    //   shadowOffsetY: 10,
    //   offset: 20,
    //   safeUsageOffset: 20,
    // }).setDepth(10000000);
    // addUIPanel({
    //   scene: this,
    //   x: 25,
    //   y: 600,
    //   width: 500,
    //   height: 200,
    //   shadowOffsetX: 15,
    //   shadowOffsetY: 15,
    //   offset: 20,
    //   safeUsageOffset: 20,
    // }).setDepth(10000000);
  }
}
