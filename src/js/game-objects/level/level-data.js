import { Math as PMath } from "phaser";
import { default as TILE } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";
import logger from "../../helpers/logger";

const noopTrue = () => true;
const debugTileMap = {
  [TILE.START]: "S",
  [TILE.SHOP]: "s",
  [TILE.ENEMY]: "e",
  [TILE.GOLD]: "g",
  [TILE.WALL]: "W",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: "."
};
const tilesetIDToEnum = {
  1: TILE.WALL,
  2: TILE.EXIT,
  3: TILE.SHOP,
  6: TILE.BLANK,
  7: TILE.ENEMY,
  8: TILE.START,
  9: TILE.EXIT,
  10: TILE.KEY
};

export default class LevelData {
  /** @param {Phaser.Tilemaps.Tilemap} map */
  constructor(map) {
    const { width, height } = map;
    this.width = width;
    this.height = height;

    this.tiles = create2DArray(width, height, undefined);

    // Loop over the ground layer, filling in all blanks
    map.setLayer("Ground");
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (map.getTileAt(x, y)) this.setTileAt(x, y, TILE.BLANK);
      }
    }

    // Loop over the foreground to place any non-blank tiles
    map.setLayer("Foreground");
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = map.getTileAt(x, y);
        if (tile) {
          const type = tilesetIDToEnum[tile.index];
          if (type !== undefined) this.setTileAt(x, y, type);
          else logger.warn("Unexpected tile index in map");
        }
      }
    }

    this.isExitLocked = map.findTile(tile => tile.index === 10);
    this.startPosition = this.getPositionOf(TILE.START);
    this.exitPosition = this.getPositionOf(TILE.EXIT);
  }

  getRandomBlankPosition(test = noopTrue) {
    const pos = { x: 0, y: 0 };
    while (true) {
      pos.x = PMath.Between(0, this.width - 1);
      pos.y = PMath.Between(0, this.height - 1);
      const tile = this.getTileAt(pos.x, pos.y);
      if (tile === TILE.BLANK && test(pos.x, pos.y)) break;
    }
    return pos;
  }

  setTileAt(x, y, tile) {
    this.tiles[y][x] = tile;
  }

  getTileAt(x, y) {
    return this.tiles[y][x];
  }

  getPositionOf(tileType) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x] === tileType) return { x, y };
      }
    }
  }

  getAllPositionsOf(tileType) {
    const positions = [];
    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === tileType) positions.push({ x, y });
      });
    });
    return positions;
  }

  debugDump() {
    const debugTiles = this.tiles.map(row => row.map(tile => (tile ? debugTileMap[tile] : " ")));
    const grid = debugTiles.map(row => row.join(" ")).join("\n");
    const flatTiles = this.tiles.flat(1);
    const numTiles = flatTiles.filter(t => t !== undefined).length;
    const numEnemy = flatTiles.filter(t => t === TILE.ENEMY).length;
    const numBlank = flatTiles.filter(t => t === TILE.BLANK).length;
    const numGold = flatTiles.filter(t => t === TILE.GOLD).length;
    const numWall = flatTiles.filter(t => t === TILE.WALL).length;
    const stats =
      `Num tiles: ${numTiles}\n` +
      `Enemy tiles: ${numEnemy} (${((numEnemy / numTiles) * 100).toFixed(2)}%)\n` +
      `Blank tiles: ${numBlank} (${((numBlank / numTiles) * 100).toFixed(2)}%)\n` +
      `Gold tiles: ${numGold} (${((numGold / numTiles) * 100).toFixed(2)}%)\n` +
      `Wall tiles: ${numWall} (${((numWall / numTiles) * 100).toFixed(2)}%)`;
    console.log(`${grid}\n${stats}`);
  }
}
