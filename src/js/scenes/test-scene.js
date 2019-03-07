import Phaser from "phaser";
import store from "../store/index";
import Tile from "../game-objects/level/tile";
import TILE_TYPES from "../game-objects/level/tile-types";

export default class Scene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    new Tile(this, TILE_TYPES.GOLD, 200, 200);
  }
}
