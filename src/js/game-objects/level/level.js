import { Math as PMath, Events } from "phaser";
import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";

const neighborOffsets = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

export default class Level {
  constructor(scene) {
    this.scene = scene;
    this.events = new Events.EventEmitter();

    const composition = {
      [TILE_TYPES.ENEMY]: 10,
      [TILE_TYPES.GOLD]: 10
    };
    const w = 9;
    const h = 6;
    const playerPos = { x: 0, y: PMath.Between(0, h - 1) };
    const exitPos = { x: w - 1, y: PMath.Between(0, h - 1) };
    this.data = new LevelData(w, h, composition, playerPos, exitPos);

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((type, x) => {
        const tile = new Tile(
          scene,
          type,
          this.gridXToWorldX(x),
          this.gridYToWorldY(y),
          this.events
        );
        tile.setGridPosition(x, y);
        tile.enableInteractive();
        if (type === TILE_TYPES.EXIT) tile.flipToFront();
        return tile;
      })
    );

    this.tiles[playerPos.y][playerPos.x].flipToFront();
  }

  countNeighboringEnemies(x, y) {
    const enemyCount = this.getNeighboringTiles(x, y).reduce((count, tile) => {
      count += tile.type === TILE_TYPES.ENEMY;
      return count;
    }, 0);
    return enemyCount;
  }

  getNeighboringTiles(x, y) {
    const tiles = [];
    neighborOffsets.forEach(([dx, dy]) => {
      const nx = x + dx;
      const ny = y + dy;
      if (this.hasTileAt(nx, ny)) {
        tiles.push(this.getTileFromGrid(nx, ny));
      }
    });
    return tiles;
  }

  getStartingWorldPosition() {
    const pos = this.data.playerPosition;
    return { x: this.gridXToWorldX(pos.x), y: this.gridYToWorldY(pos.y) };
  }

  getStartingGridPosition() {
    const pos = this.data.playerPosition;
    return { x: pos.x, y: pos.y };
  }

  gridXToWorldX(x) {
    return 50 + x * 80;
  }

  gridYToWorldY(y) {
    return 50 + y * 80;
  }

  getTileFromGrid(x, y) {
    if (this.tiles[y] && this.tiles[y][x]) {
      return this.tiles[y][x];
    }
    return null;
  }

  enableAllTiles() {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        tile.enableInteractive();
      });
    });
  }

  disableAllTiles() {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        tile.disableInteractive();
      });
    });
  }

  isTileInPlayerRange(playerPos, tilePos) {
    return (
      (tilePos.x <= playerPos.x + 1 &&
        tilePos.x >= playerPos.x - 1 &&
        tilePos.y === playerPos.y) ||
      (tilePos.y <= playerPos.y + 1 &&
        tilePos.y >= playerPos.y - 1 &&
        tilePos.x === playerPos.x)
    );
  }
}
