import { Utils } from "phaser";
import { default as TILE } from "./tile-types";

const debugTileMap = {
  [TILE.ENEMY]: "e",
  [TILE.GOLD]: "g",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: "."
};

const create2DArray = (width, height, value) =>
  [...Array(height)].map(() => Array(width).fill(value));

export default class LevelData {
  constructor(width, height, composition, playerPosition, exitPosition) {
    this.width = width;
    this.height = height;
    this.composition = composition;
    this.playerPosition = playerPosition;
    this.exitPosition = exitPosition;

    this.tiles = create2DArray(width, height, TILE.BLANK);
    this.setTileAt(exitPosition.x, exitPosition.y, TILE.EXIT);

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
      pos => pos.x !== playerPosition.x && pos.y !== playerPosition.y
    );
    Utils.Array.Shuffle(positions);
    tilesToPlace.forEach((tile, i) => this.setTileAt(positions[i].x, positions[i].y, tile));
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
