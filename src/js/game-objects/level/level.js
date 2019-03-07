import { Math as PMath } from "phaser";
import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";

export default class Level {
  constructor(scene) {
    this.scene = scene;

    const composition = {
      [TILE_TYPES.ENEMY]: 10,
      [TILE_TYPES.GOLD]: 10
    };
    const w = 9;
    const h = 6;
    const playerPos = { x: 0, y: PMath.Between(0, h - 1) };
    const exitPos = { x: w - 1, y: PMath.Between(0, h - 1) };
    this.data = new LevelData(w, h, composition, playerPos, exitPos);
    this.data.debugDump();

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((type, x) => {
        const tile = new Tile(scene, type, this.gridXToWorldX(x), this.gridYToWorldY(y));
        if (type === TILE_TYPES.EXIT) tile.flipToFront();
        return tile;
      })
    );
  }

  getStartingPosition() {
    const pos = this.data.playerPosition;
    return { x: this.gridXToWorldX(pos.x), y: this.gridYToWorldY(pos.y) };
  }

  gridXToWorldX(x) {
    return 50 + x * 80;
  }

  gridYToWorldY(y) {
    return 50 + y * 80;
  }
}
