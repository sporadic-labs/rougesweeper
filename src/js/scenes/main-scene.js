import Phaser from "phaser";
import Level from "../game-objects/level/level";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import DangerIndicator from "../game-objects/danger-indicator";
import store from "../store/index";

export default class Scene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    const player = new Player(this, 0, 0);
    const gameManager = new GameManager(this, player);

    new DangerIndicator(this, store);
  }
}
