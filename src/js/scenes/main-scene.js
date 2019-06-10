import Phaser from "phaser";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import DangerIndicator from "../game-objects/hud/danger-indicator";
import PurseIndicator from "../game-objects/hud/purse-indicator";
import HealthIndicator from "../game-objects/hud/health-indicator";
import AttackToggle from "../game-objects/hud/attack-toggle";
import LevelIndicator from "../game-objects/hud/level-indicator";
import MovesIndicator from "../game-objects/hud/moves-indicator";
import store from "../store/index";
import ToastManager from "../game-objects/hud/toast-manager";
import Shop from "../game-objects/hud/shop";

export default class Scene extends Phaser.Scene {
  create() {
    const { width, height } = this.game.config;
    this.add.image(width / 2, height / 2, "assets", "temple-demo-2");

    store.startNewGame();

    const player = new Player(this, 0, 0);
    const toastManager = new ToastManager(this);
    const gameManager = new GameManager(this, player, toastManager);

    new Shop(this, store);
    new DangerIndicator(this, store);
    new PurseIndicator(this, store);
    new HealthIndicator(this, store);
    new AttackToggle(this, store);
    new LevelIndicator(this, store);
    new MovesIndicator(this, store);
  }
}
