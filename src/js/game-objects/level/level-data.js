import { Utils, Math as PMath } from "phaser";
import { default as TILE } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";

const noopTrue = () => true;
const debugTileMap = {
  [TILE.ENEMY]: "e",
  [TILE.GOLD]: "g",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: "."
};

export default class LevelData {
  constructor(map, composition) {
    const { width, height } = map;
    this.width = width;
    this.height = height;

    this.composition = composition;

    this.tiles = create2DArray(width, height, undefined);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (map.hasTileAt(x, y)) this.setTileAt(x, y, TILE.BLANK);
      }
    }

    this.playerPosition = this.getRandomBlankPosition();

    this.exitPosition = this.getRandomBlankPosition(
      pos => pos.x !== this.playerPosition.x && pos.y !== this.playerPosition.y
    );
    this.setTileAt(this.exitPosition.x, this.exitPosition.y, TILE.EXIT);

    const numEnemyTiles = composition[TILE.ENEMY] || 0;
    const numGoldTiles = composition[TILE.GOLD] || 0;
    if (numEnemyTiles + numGoldTiles + 2 > width * height) {
      throw Error("The specified composition doesn't fit in the given width & height!");
    }
    const tilesToPlace = [
      ...Array(numEnemyTiles).fill(TILE.ENEMY),
      ...Array(numGoldTiles).fill(TILE.GOLD)
    ];
    const positions = this.getAllPositionsOf(TILE.BLANK).filter(
      pos => pos.x !== this.playerPosition.x && pos.y !== this.playerPosition.y
    );
    Utils.Array.Shuffle(positions);
    tilesToPlace.forEach((tile, i) => this.setTileAt(positions[i].x, positions[i].y, tile));
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
    const debugTiles = this.tiles.map(row => row.map(tile => debugTileMap[tile]));
    const string = debugTiles.map(row => row.join(" ")).join("\n");
    console.log(string);
  }
}
