import { Utils, Math as PMath } from "phaser";
import { default as TILE } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";

const noopTrue = () => true;
const debugTileMap = {
  [TILE.ENTRANCE]: "S",
  [TILE.SHOP]: "s",
  [TILE.ENEMY]: "e",
  [TILE.GOLD]: "g",
  [TILE.WALL]: "W",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: "."
};

export default class LevelData {
  constructor(map, composition) {
    const { width, height } = map;
    this.width = width;
    this.height = height;

    this.composition = composition;
    const numEnemyTiles = composition[TILE.ENEMY] || 0;
    const numGoldTiles = composition[TILE.GOLD] || 0;
    if (numEnemyTiles + numGoldTiles + 2 > width * height) {
      throw Error("The specified composition doesn't fit in the given width & height!");
    }

    this.tiles = create2DArray(width, height, undefined);
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = map.getTileAt(x, y);
        if (tile) {
          let type;
          if (tile.index === 2) type = TILE.BLANK;
          else if (tile.index === 3) type = TILE.WALL;
          else throw new Error("Unexpected tile index in map");
          this.setTileAt(x, y, type);
        }
      }
    }

    const playerSpots = this.getAllPositionsOf(TILE.BLANK);
    this.playerPosition = Utils.Array.GetRandom(playerSpots);
    this.setTileAt(this.playerPosition.x, this.playerPosition.y, TILE.ENTRANCE);
    const isNextToPlayer = p =>
      PMath.Distance.Between(p.x, p.y, this.playerPosition.x, this.playerPosition.y) < 2;

    const exitSpots = this.getAllPositionsOf(TILE.BLANK).filter(p => !isNextToPlayer(p));
    this.exitPosition = Utils.Array.GetRandom(exitSpots);
    this.setTileAt(this.exitPosition.x, this.exitPosition.y, TILE.EXIT);

    const shopSpots = this.getAllPositionsOf(TILE.BLANK);
    this.shopPosition = Utils.Array.GetRandom(shopSpots);
    this.setTileAt(this.shopPosition.x, this.shopPosition.y, TILE.SHOP);

    const enemySpots = this.getAllPositionsOf(TILE.BLANK).filter(p => !isNextToPlayer(p));
    Utils.Array.Shuffle(enemySpots);
    enemySpots.slice(0, numEnemyTiles).forEach(p => this.setTileAt(p.x, p.y, TILE.ENEMY));

    const goldSpots = this.getAllPositionsOf(TILE.BLANK);
    Utils.Array.Shuffle(goldSpots);
    goldSpots.slice(0, numGoldTiles).forEach(p => this.setTileAt(p.x, p.y, TILE.GOLD));

    this.debugDump();
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
