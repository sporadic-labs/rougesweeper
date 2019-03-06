import Phaser from "phaser";

const TILE = {
  ENEMY: "ENEMY",
  PLAYER: "PLAYER",
  EXIT: "EXIT",
  BLANK: "BLANK",
  NULL: "NULL"
};

const debugTileMap = {
  [TILE.ENEMY]: "e",
  [TILE.GOLD]: "g",
  [TILE.PLAYER]: "P",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: ".",
  [TILE.NULL]: " " // For non-rectangular maps where some tiles are not part of the map
};

const create2DArray = (width, height, value) =>
  [...Array(height)].map(() => Array(width).fill(value));

class Level {
  constructor(width, height, composition, playerPosition, exitPosition) {
    this.width = width;
    this.height = height;
    this.composition = composition;
    this.playerPosition = playerPosition;
    this.exitPosition = exitPosition;

    this.tiles = create2DArray(width, height, TILE.BLANK);
    this.setTileAt(playerPosition.x, playerPosition.y, TILE.PLAYER);
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
    const positions = this.getAllPositionsOf(TILE.BLANK);
    Phaser.Utils.Array.Shuffle(positions);
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

const composition = {
  [TILE.ENEMY]: 10,
  [TILE.GOLD]: 5
};
new Level(10, 10, composition, { x: 0, y: 0 }, { x: 9, y: 9 }).debugDump();

export default Level;
