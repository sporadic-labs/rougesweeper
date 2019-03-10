import Phaser from "phaser";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import DangerIndicator from "../game-objects/danger-indicator";
import PurseIndicator from "../game-objects/purse-indicator";
import HealthIndicator from "../game-objects/health-indicator";
import AttackToggle from "../game-objects/attack-toggle";
import store from "../store/index";

export default class Scene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    const player = new Player(this, 0, 0);
    const gameManager = new GameManager(this, player);

    new DangerIndicator(this, store);
    new PurseIndicator(this, store);
    new HealthIndicator(this, store);
    new AttackToggle(this, store);
  }
}
