import Phaser from "phaser";
import store from "../store/index";
import TILE_TYPES from "../game-objects/level/tile-types";
import Level from "../game-objects/level/level";
import Player from "../game-objects/player/index";

export default class Scene extends Phaser.Scene {
  create() {
    this.add
      .tileSprite(0, 0, 750, 750, "assets", "subtle-pattern-ep-natural-black")
      .setOrigin(0, 0);

    const level = new Level(this);
    const playerPosition = level.getStartingPosition();
    new Player(this, playerPosition.x, playerPosition.y);
  }
}
