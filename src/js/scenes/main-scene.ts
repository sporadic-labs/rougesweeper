import Phaser, { Scene } from "phaser";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import TechIndicator from "../game-objects/hud/tech-indicator";
import AlertIndicator from "../game-objects/hud/alert-indicator";
import PauseToggle from "../game-objects/hud/pause-toggle";
import LevelIndicator from "../game-objects/hud/level-indicator";
import store from "../store/index";
import ToastManager from "../game-objects/hud/toast-manager";
import Shop from "../game-objects/hud/shop";
import ShopUnlock from "../game-objects/hud/shop-item-unlock-menu";
import AmmoIndicator from "../game-objects/hud/ammo-indicator";
import ShopToggle from "../game-objects/hud/shop-toggle";

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

    new Shop(this, store, toastManager);
    new ShopUnlock(this, store, toastManager);
    new TechIndicator(this, store);
    new AlertIndicator(this, store);
    new AmmoIndicator(this, store);
    new PauseToggle(this, store);
    new LevelIndicator(this, store);
    new ShopToggle(this, store);
  }
}
