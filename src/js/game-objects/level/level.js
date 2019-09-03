import { Math as PMath, Events } from "phaser";
import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";
import PathFinder from "./path-finder";
import { gameCenter } from "../../game-dimensions";

const neighborOffsets = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

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
    let tilesSetImage = null;
    const levelKeyParts = levelKey.split("-");
    switch (levelKeyParts[1]) {
      case "1":
      default:
        tilesSetImage = this.map.addTilesetImage("hq");
        break;
      case "2":
        tilesSetImage = this.map.addTilesetImage("warehouse");
        break;
      case "3":
        tilesSetImage = this.map.addTilesetImage("lab");
        break;
      case "4":
        tilesSetImage = this.map.addTilesetImage("skyscraper");
        break;
      case "5":
        tilesSetImage = this.map.addTilesetImage("temple");
        break;
    }
    this.map.layers.forEach(layerData => {
      // TODO: standardize Tiled structure. Ignoring the dynamic gameboard stuff.
      if (!layerData.name === "Background") return;
      const layer = this.map.createStaticLayer(layerData.name, tilesSetImage);
      layer.setPosition(
        gameCenter.x - layer.displayWidth / 2,
        gameCenter.y - layer.displayHeight / 2
      );
    });

    this.data = new LevelData(this.map);
    this.pathFinder = new PathFinder(this.data.width, this.data.height);

    this.left = this.data.topLeftTile.getLeft();
    this.top = this.data.topLeftTile.getTop();
    this.tileWidth = this.map.tileWidth * 2;
    this.tileHeight = this.map.tileHeight * 2;

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((type, x) => {
        if (!type) return undefined;

        const dialogueData = dialogueManager.getDialogueDataForTile(levelKey, x, y);

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
      if (tile.isRevealed || this.isTileInPlayerRange(playerPos, tile.getGridPosition())) {
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
    return this.left + x * this.tileWidth + this.tileWidth / 2;
  }

  gridYToWorldY(y) {
    return this.top + y * this.tileHeight + this.tileHeight / 2;
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
   * @param {boolean} allowNeighbor Whether or not to allow player to take one step beyond the
   * currently revealed tiles (i.e. step from a revealed tile to the neighboring unrevealed tile).
   */
  findPathBetween(playerPos, tilePos, allowNeighbor = false) {
    // Note: this is inefficient, but ensures the pathfinder is up-to-date. To optimize, level needs
    // to know when tiles are highlighted/unhighlighted and revealed/hidden.
    this.pathFinder.setAllUnwalkable();
    this.tiles.map((row, y) =>
      row.map((tile, x) => {
        if (tile && tile.isRevealed && tile.type !== TILE_TYPES.WALL) {
          this.pathFinder.setWalkableAt(x, y);
        }
      })
    );
    if (allowNeighbor) {
      // Breadth-first search around the player to explore all walkable tiles that are reachable by
      // the player. For each tile, check its direct neighbors. If a direct neighbor isn't walkable,
      // it should be made walkable.
      const pointsQueue = [playerPos];
      const visitedPoints = [];
      const newlyWalkablePoints = [];
      const isPointInArray = (p1, array) => array.some(p2 => p1.x === p2.x && p1.y === p2.y);
      while (pointsQueue.length !== 0) {
        const { x, y } = pointsQueue.shift();
        visitedPoints.push({ x, y });
        neighborOffsets.forEach(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          const np = { x: nx, y: ny };
          if (this.pathFinder.isInBounds(nx, ny)) {
            if (this.pathFinder.isWalkableAt(nx, ny)) {
              // Only add to queue if we haven't visited or aren't already planning on visiting.
              if (!isPointInArray(np, pointsQueue) && !isPointInArray(np, visitedPoints)) {
                pointsQueue.push(np);
              }
            } else {
              const tile = this.tiles[ny][nx];
              if (
                tile &&
                (!tile.isRevealed() || tile.type !== TILE_TYPES.WALL) &&
                !isPointInArray(np, newlyWalkablePoints)
              )
                newlyWalkablePoints.push(np);
            }
          }
        });
      }
      newlyWalkablePoints.forEach(p => this.pathFinder.setWalkableAt(p.x, p.y));
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
