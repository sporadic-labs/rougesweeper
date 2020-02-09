import Phaser, { Events, Tilemaps, Scene, GameObjects } from "phaser";
import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";
import PathFinder from "./path-finder";
import DEPTHS from "../depths";
import { gameCenter } from "../../game-dimensions";
import Door, { DOOR_PLACEMENT } from "./door";
import getTileFrame from "./get-tile-frame";
import getTilesetName from "./get-tileset-name";
import DialogueManager from "../hud/dialogue-manager";
import { Point } from "../../helpers/common-interfaces";

const Distance = Phaser.Math.Distance.BetweenPoints;
const isPointInArray = (p1: Point, array: Point[]) =>
  array.some(p2 => p1.x === p2.x && p1.y === p2.y);
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
  public events = new Events.EventEmitter();
  public exitWorldPosition: Point;
  public exitGridPosition: Point;
  public exit: Door;
  public entranceWorldPosition: Point;
  public entranceGridPosition: Point;
  public entrance: Door;
  private map: Tilemaps.Tilemap;
  private data: LevelData;
  private pathFinder: PathFinder;
  private left: number;
  private top: number;
  private tileWidth: number;
  private tileHeight: number;
  private background: GameObjects.Rectangle;
  private tiles: Tile[][];

  constructor(private scene: Scene, levelKey: string, dialogueManager: DialogueManager) {
    // Set up the tilemap with necessary statics graphics layers, i.e. everything but the gameboard.
    this.map = scene.add.tilemap(levelKey);
    const tilesSetImage = this.map.addTilesetImage(getTilesetName(levelKey));

    this.map.layers.forEach(layerData => {
      // TODO: standardize Tiled structure. Ignoring the dynamic gameboard stuff.
      let tileSet = tilesSetImage;
      let depth = DEPTHS.BOARD;
      if (layerData.name === "Decorations") {
        tileSet = this.map.addTilesetImage("decorations");
        depth = DEPTHS.ABOVE_GROUND;
      }
      const layer = this.map.createDynamicLayer(layerData.name, tileSet);
      layer.setPosition(
        gameCenter.x - layer.displayWidth / 2,
        gameCenter.y - layer.displayHeight / 2
      );
      layer.setDepth(depth);
    });

    this.data = new LevelData(this.map);
    this.pathFinder = new PathFinder(this.data.width, this.data.height);
    this.left = this.map.tileToWorldX(this.data.leftOffset);
    this.top = this.map.tileToWorldY(this.data.topOffset);
    this.tileWidth = this.map.tileWidth;
    this.tileHeight = this.map.tileHeight;

    const mapWidth = this.map.widthInPixels;
    this.background = scene.add
      .rectangle(gameCenter.x, gameCenter.y, mapWidth + 12, this.map.heightInPixels + 12, 0x585e5e)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setDepth(DEPTHS.GROUND)
      .setOrigin(0.5, 0.5);

    const tileKey = getTileFrame(levelKey);
    this.tiles = this.data.tiles.map((row, y) =>
      row.map((dataTile, x) => {
        if (!dataTile || !dataTile.type) return undefined;

        const { type, phaserTile } = dataTile;
        const { frameName } = phaserTile.properties;

        const dialogueData = dialogueManager.getDialogueDataForTile(levelKey, x, y);

        if (type === TILE_TYPES.EXIT) {
          // Find the center world position of the whole door (which is 2 tall) from the top tile.
          this.exitWorldPosition = {
            x: phaserTile.getCenterX(),
            y: phaserTile.getBottom()
          };
          this.exitGridPosition = { x, y };
          // All doors are two tall, so remove both tiles.
          this.map.removeTileAt(phaserTile.x, phaserTile.y);
          this.map.removeTileAt(phaserTile.x, phaserTile.y + 1);
          const isOpen = !this.data.doesLevelHaveKey();
          this.exit = new Door(
            scene,
            this.gridXToWorldX(x),
            this.gridYToWorldY(y),
            this.events,
            phaserTile.properties.frameName,
            isOpen,
            DOOR_PLACEMENT.RIGHT,
            tileKey
          );
          return;
        } else if (type === TILE_TYPES.ENTRANCE) {
          // Find the center world position of the whole door (which is 2 tall) from the top tile.
          this.entranceWorldPosition = {
            x: phaserTile.getCenterX(),
            y: phaserTile.getBottom()
          };
          this.entranceGridPosition = { x, y };
          // All doors are two tall, so remove both tiles.
          this.map.removeTileAt(phaserTile.x, phaserTile.y);
          this.map.removeTileAt(phaserTile.x, phaserTile.y + 1);
          const isOpen = false;
          this.entrance = new Door(
            scene,
            this.gridXToWorldX(x),
            this.gridYToWorldY(y),
            this.events,
            phaserTile.properties.frameName,
            isOpen,
            DOOR_PLACEMENT.LEFT,
            tileKey
          );
          return;
        }

        const tile = new Tile(
          scene,
          tileKey,
          type,
          frameName,
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
  }

  highlightTiles(playerPos: Point) {
    this.forEachTile((tile: Tile) => {
      if (tile.isRevealed || this.isTileInPlayerRange(playerPos, tile.getGridPosition())) {
        tile.highlight();
      } else {
        tile.unhighlight();
      }
    });
    if (this.exit.isTileFlipped || Distance(this.exitGridPosition, playerPos) <= 1.5) {
      this.exit.highlightTile();
    } else {
      this.exit.unhighlightTile();
    }
    if (this.entrance.isTileFlipped || Distance(this.entranceGridPosition, playerPos) <= 1.5) {
      this.entrance.highlightTile();
    } else {
      this.entrance.unhighlightTile();
    }
  }

  isNeighboringScrambleEnemy(x: number, y: number) {
    const tiles = this.getNeighboringTiles(x, y);
    for (const tile of tiles) {
      if (!tile.isCurrentlyBlank && tile.type === TILE_TYPES.SCRAMBLE_ENEMY) {
        const dx = Math.abs(tile.gridX - x);
        const dy = Math.abs(tile.gridY - y);
        if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
          return true;
        }
      }
    }
    return false;
  }

  countNeighboringEnemies(x: number, y: number) {
    const enemyCount = this.getNeighboringTiles(x, y).reduce((count, tile) => {
      const isEnemy = tile.type === TILE_TYPES.ENEMY || tile.type === TILE_TYPES.SCRAMBLE_ENEMY;
      if (isEnemy && !tile.isCurrentlyBlank) count += 1;
      return count;
    }, 0);
    return enemyCount;
  }

  getNeighboringTiles(x: number, y: number) {
    const tiles: Tile[] = [];
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
    const { x, y } = this.data.entrancePosition;
    return { x: this.gridXToWorldX(x + 1), y: this.gridYToWorldY(y) };
  }

  getStartingGridPosition() {
    const { x, y } = this.data.entrancePosition;
    return { x: x + 1, y };
  }

  getExitWorldPosition() {
    return {
      x: this.gridXToWorldX(this.data.exitPosition.x),
      y: this.gridXToWorldX(this.data.exitPosition.y)
    };
  }

  gridXYToWorldXY(pos: Point) {
    return {
      x: this.gridXToWorldX(pos.x),
      y: this.gridYToWorldY(pos.y)
    };
  }

  /**
   * Convert from grid x to the center x of a tile in the world. This factors in the fact that the
   * tiles are offset by half a tile from the tilemap position.
   */
  gridXToWorldX(x: number) {
    return this.left + x * this.tileWidth + this.tileWidth;
  }

  /**
   * Convert from grid y to the center y of a tile in the world. This factors in the fact that the
   * tiles are offset by half a tile from the tilemap position.
   */
  gridYToWorldY(y: number) {
    return this.top + y * this.tileHeight + this.tileHeight;
  }

  hasTileAt(x: number, y: number) {
    return this.tiles[y] && this.tiles[y][x];
  }

  getTileFromGrid(x: number, y: number) {
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
  forEachTile(cb: (t: Tile) => void) {
    this.tiles.forEach(row => {
      row.forEach(tile => {
        if (tile) cb(tile);
      });
    });
  }

  isTileInPlayerRange(playerPos: Point, tilePos: Point) {
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
  findPathBetween(playerPos: Point, tilePos: Point, allowNeighbor = false) {
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
    if (this.exit.isOpen()) {
      this.pathFinder.setWalkableAt(this.exitGridPosition.x, this.exitGridPosition.y);
    }
    if (this.entrance.isOpen()) {
      this.pathFinder.setWalkableAt(this.entranceGridPosition.x, this.entranceGridPosition.y);
    }
    this.pathFinder.update();

    const isDestinationBlocked = !this.pathFinder.isWalkableAt(tilePos.x, tilePos.y);
    if (isDestinationBlocked && allowNeighbor) {
      // Player's destination is unwalkable, so do a breadth-first search around player to see if
      // the destination is a direct neighbor (one step away) from a walkable tile.
      let newDestination = null;
      const pointsQueue = [playerPos];
      const visitedPoints = [];
      while (!newDestination && pointsQueue.length !== 0) {
        const { x, y } = pointsQueue.shift();
        visitedPoints.push({ x, y });
        for (const [dx, dy] of neighborOffsets) {
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
                tilePos.x === nx &&
                tilePos.y === ny &&
                tile &&
                (!tile.isRevealed || tile.type !== TILE_TYPES.WALL)
              ) {
                // We've found a walkable tile that directly neighbors the desired destination, so
                // we can use that for path finding.
                newDestination = { x, y };
                break;
              }
            }
          }
        }
      }
      if (!newDestination) return null;

      // Find path to our modified destination and add in the final step from the walkable neighbor
      // to the unwalkable original destination.
      const path = this.pathFinder.findPath(playerPos, newDestination);
      if (path) return [...path, tilePos];
      else return path;
    } else {
      return this.pathFinder.findPath(playerPos, tilePos);
    }
  }

  fadeLevelOut() {
    const tilePromises: Promise<void>[] = [];
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
    const promises = [];
    // Staggered fade in from left to right of floor
    this.tiles.forEach((row, y) =>
      row.forEach((tile, x) => {
        if (tile) {
          const p = tile.fadeTileIn(250, x * 50);
          promises.push(p);
        }
      })
    );
    promises.push(this.entrance.open());
    return Promise.all(promises).then(() => {
      const start = this.getStartingGridPosition();
      this.tiles[start.y][start.x].flipToFront();
      this.getNeighboringTiles(start.x, start.y).map(tile => tile.flipToFront());
    });
  }

  destroy() {
    this.tiles.forEach(row =>
      row.forEach(tile => {
        if (tile) tile.destroy();
      })
    );
    this.entrance.destroy();
    this.exit.destroy();
    this.map.destroy();
    this.events.destroy();
    this.scene = undefined;
    this.data = undefined;
  }
}
