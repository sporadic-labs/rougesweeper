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
  constructor(map, composition) {
    const { width, height } = map;

    this.composition = composition;

    this.tiles = create2DArray(width, height, undefined);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (map.hasTileAt(x, y)) this.setTileAt(x, y, TILE.BLANK);
      }
    }

    const spawnPoints = map.getObjectLayer("Spawn Points").objects.map(obj => {
      return map.worldToTileXY(obj.x, obj.y);
    });
    this.playerPosition = Utils.Array.GetRandom(spawnPoints);

    const exitPoints = map.getObjectLayer("Exit Points").objects.map(obj => {
      return map.worldToTileXY(obj.x, obj.y);
    });
    this.exitPosition = Utils.Array.GetRandom(exitPoints);
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
