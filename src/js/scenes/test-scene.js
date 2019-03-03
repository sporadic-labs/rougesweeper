import Phaser from "phaser";
import Player from "../game-objects/player/";
import PlayerName from "../game-objects/player-name";
import store from "../store/index";

export default class Scene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    new PlayerName(this, store);
    new Player(this, 300, 300);
  }
}
