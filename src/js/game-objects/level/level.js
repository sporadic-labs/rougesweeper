import { Math as PMath, Events } from "phaser";
import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";
import PathFinder from "./path-finder";

const neighborOffsets = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1]
];

export default class Level {
  /**
   * @param {Phaser.Scene} scene
   * @param {*} levelKey
   * @param {*} dialogueManager
   * @memberof Level
   */
  constructor(scene, levelKey, dialogueManager) {
    this.scene = scene;
    this.events = new Events.EventEmitter();

    // Set up the tilemap with necessary statics graphics layers, i.e. everything but the gameboard.
    this.map = scene.add.tilemap(levelKey);
    const tiles = this.map.addTilesetImage("hq-tileset");
    this.map.layers.forEach(layerData => {
      // TODO: standardize Tiled structure. Ignoring the dynamic gameboard stuff.
      if (layerData.name === "Foreground" || layerData.name === "Ground") return;
      this.map.createStaticLayer(layerData.name, tiles);
    });

    this.data = new LevelData(this.map);
    this.pathFinder = new PathFinder(this.data.width, this.data.height);

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((type, x) => {
        if (!type) return undefined;

        const dialogueData = dialogueManager.getDialogueDataForTile(
          levelKey,
          x,
          y
        );

        const tile = new Tile(
          scene,
          levelKey,
          type,
          this.gridXToWorldX(x),
          this.gridYToWorldY(y),
          this.events,
          dialogueData
        );
        tile.setGridPosition(x, y);
        tile.enableInteractive();
        return tile;
      })
    );

    const start = this.data.startPosition;
    this.tiles[start.y][start.x].flipToFront();
    this.getNeighboringTiles(start.x, start.y).map(tile => {
      tile.flipToFront();
    });

    const exit = this.data.exitPosition;
    this.tiles[exit.y][exit.x].flipToFront();
  }

  highlightTiles(playerPos) {
    this.forEachTile(tile => {
      if (tile.isRevealed() || this.isTileInPlayerRange(playerPos, tile.getGridPosition())) {
        tile.highlight();
      } else {
        tile.unhighlight();
      }
    });
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

  isExitLocked() {
    return this.data.isExitLocked;
  }

  getStartingWorldPosition() {
    const { x, y } = this.data.startPosition;
    return { x: this.gridXToWorldX(x), y: this.gridYToWorldY(y) };
  }

  getStartingGridPosition() {
    const { x, y } = this.data.startPosition;
    return { x, y };
  }

  getExitWorldPosition() {
    return {
      x: this.gridXToWorldX(this.data.exitPosition.x),
      y: this.gridXToWorldX(this.data.exitPosition.y)
    };
  }

  gridXYToWorldXY(pos) {
    return {
      x: this.gridXToWorldX(pos.x),
      y: this.gridYToWorldY(pos.y)
    };
  }

  gridXToWorldX(x) {
    return 50 + x * 80;
  }

  gridYToWorldY(y) {
    return 50 + y * 80;
  }

  hasTileAt(x, y) {
    return this.tiles[y] && this.tiles[y][x];
  }

  getTileFromGrid(x, y) {
    if (this.tiles[y] && this.tiles[y][x]) {
      return this.tiles[y][x];
    }
    return null;
  }

  enableAllTiles() {
    this.forEachTile(tile => tile.enableInteractive());
  }

  disableAllTiles() {
    this.forEachTile(tile => tile.disableInteractive());
  }

  /**
   * Runs the given callback for each tile that exists in the map
   * @param {function} cb
   */
  forEachTile(cb) {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        if (tile) cb(tile);
      });
    });
  }

  isTileInPlayerRange(playerPos, tilePos) {
    const dx = playerPos.x - tilePos.x;
    const dy = playerPos.y - tilePos.y;
    return dx >= -1 && dx <= 1 && dy >= -1 && dy <= 1;
  }

  /**
   * Find an A* path between the player and tile position if it exists.
   * @param {{x,y}} playerPos
   * @param {{x,y}} tilePos
   * @param {boolean} allowNeighbor Whether or not to allow face down tiles neighboring the player
   * position in the path (e.g. when attempting to move to a new face down tile, set this to true).
   */
  findPathBetween(playerPos, tilePos, allowNeighbor = false) {
    // Note: this is inefficient, but ensures the pathfinder is up-to-date. To optimize, level needs
    // to know when tiles are highlighted/unhighlighted and revealed/hidden.
    this.pathFinder.setAllUnwalkable();
    this.tiles.map((row, y) =>
      row.map((tile, x) => {
        if (tile && tile.isRevealed() && tile.type !== TILE_TYPES.WALL) {
          this.pathFinder.setWalkableAt(x, y);
        }
      })
    );
    if (allowNeighbor) {
      neighborOffsets.forEach(([dx, dy]) => {
        const nx = playerPos.x + dx;
        const ny = playerPos.y + dy;
        if (this.hasTileAt(nx, ny)) this.pathFinder.setWalkableAt(nx, ny);
      });
    }
    this.pathFinder.update();
    return this.pathFinder.findPath(playerPos, tilePos);
  }

  fadeLevelOut() {
    const tilePromises = [];
    // Flip all to the front, then half a second later, kick off the fade out from left to right
    this.tiles.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile) {
          tile.flipToFront();
          const p = tile.fadeTileOut(250, 500 + x * 50);
          tilePromises.push(p);
        }
      })
    );
    return Promise.all(tilePromises);
  }

  fadeLevelIn() {
    const tilePromises = [];
    // Staggered fade in from left to right of floor
    this.tiles.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile) {
          const p = tile.fadeTileIn(250, x * 50);
          tilePromises.push(p);
        }
      })
    );
    return Promise.all(tilePromises);
  }

  destroy() {
    this.tiles.forEach(row =>
      row.forEach(tile => {
        if (tile) tile.destroy();
      })
    );
    this.map.destroy();
    this.events.destroy();
    this.scene = undefined;
    this.data = undefined;
  }
}
