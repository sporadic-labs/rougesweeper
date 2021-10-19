import Phaser, { Tilemaps, Scene, GameObjects } from "phaser";
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
import EventEmitter from "../../helpers/event-emitter";
import { LevelEmitter } from "./events";
import { neighborOffsets } from "./neighbor-offsets";

const Distance = Phaser.Math.Distance.BetweenPoints;

enum LEVEL_STATE {
  TRANSITION_IN = "TRANSITION_IN",
  RUNNING = "RUNNING",
  TRANSITION_OUT = "TRANSITION_OUT"
}

export default class Level {
  public events: LevelEmitter = new EventEmitter();
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
  private state: LEVEL_STATE = LEVEL_STATE.TRANSITION_IN;

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
        depth = DEPTHS.BOARD;
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

        const { type, phaserTile, isReachable } = dataTile;
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
          this,
          isReachable,
          dialogueData
        );
        tile.setGridPosition(x, y);
        tile.enableInteractive();
        return tile;
      })
    );

    this.setScrambleableTiles();

    // NOTE(rex): Make this less fragile...
    const isTutorialLevel = levelKey === "level-1-floor-1"
    if (isTutorialLevel) this.forEachTile((t) => t.flipToFront())
  }

  onTileFlip(tile: Tile) {
    // Avoid expensive checks on every tile when we are fading out and flipping all the tiles.
    if (this.state !== LEVEL_STATE.RUNNING) return;

    if (tile.isRevealed && tile.type === TILE_TYPES.SCRAMBLE_ENEMY) this.setScrambleableTiles();

    // If the revealed tile is a wall, then it's time to check its neighbors to see if they are
    // unreachable and need to be flipped now.
    if (tile.isRevealed && tile.type === TILE_TYPES.WALL) {
      const { x, y } = tile.getGridPosition();
      this.getNeighboringTiles(x, y).forEach(tile => {
        if (!tile.isReachable) {
          const neighborPos = tile.getGridPosition();
          const shouldFlip = this.checkIfNeighborsAreRevealed(neighborPos.x, neighborPos.y);
          if (shouldFlip) {
            tile.flipToFront();
          }
        }
      });
    }
  }

  /**
   * Check if all reachable locations around a given tile are revealed.
   * @param gridX
   * @param gridY
   */
  checkIfNeighborsAreRevealed(gridX: number, gridY: number) {
    let areAllRevealed = true;
    this.getNeighboringTiles(gridX, gridY).forEach(tile => {
      if (tile.isReachable && !tile.isRevealed) areAllRevealed = false;
    });
    return areAllRevealed;
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

  unhighlightTiles(playerPos: Point) {
    this.forEachTile((tile: Tile) => {
      if (tile.isRevealed) {
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

  setScrambleableTiles(): void {
    const scrambleEnemyPositions = this.data.getAllPositionsOf(TILE_TYPES.SCRAMBLE_ENEMY);
    scrambleEnemyPositions.forEach(pos => {
      const tile = this.getTileFromGrid(pos.x, pos.y);
      const show = !tile.isRevealed;
      const tilesToBottom = this.data.getGridHeight() - tile.gridY;
      const tilesToRight = this.data.getGridWidth() - tile.gridX;
      const xMax = tilesToRight > tile.gridX ? tilesToRight : tile.gridX;
      const yMax = tilesToBottom > tile.gridY ? tilesToBottom : tile.gridY;
      for (let i = 0; i < xMax; i += 1) {
        const minTile = this.getTileFromGrid(tile.gridX - i, tile.gridY);
        if (minTile && minTile.type !== TILE_TYPES.WALL && minTile.getCanScramble() !== show)
          minTile.setCanScramble(show);
        const maxTile = this.getTileFromGrid(tile.gridX + i, tile.gridY);
        if (maxTile && maxTile.type !== TILE_TYPES.WALL && maxTile.getCanScramble() !== show)
          maxTile.setCanScramble(show);
      }
      for (let i = 0; i < yMax; i += 1) {
        const minTile = this.getTileFromGrid(tile.gridX, tile.gridY - i);
        if (minTile && minTile.type !== TILE_TYPES.WALL && minTile.getCanScramble() !== show)
          minTile.setCanScramble(show);
        const maxTile = this.getTileFromGrid(tile.gridX, tile.gridY + i);
        if (maxTile && maxTile.type !== TILE_TYPES.WALL && maxTile.getCanScramble() !== show)
          maxTile.setCanScramble(show);
      }
    });
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

  isTileScrambled(x: number, y: number) {
    const scrambleEnemyPositions = this.data.getAllPositionsOf(TILE_TYPES.SCRAMBLE_ENEMY);
    for (const pos of scrambleEnemyPositions) {
      const scrambleTile = this.getTileFromGrid(pos.x, pos.y);
      if (scrambleTile.isRevealed) continue;
      else if (pos.x === x || pos.y === y) return true;
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
    const exitPos = this.data.exitPosition;
    return {
      x: this.gridXToWorldX(exitPos.x),
      y: this.gridYToWorldY(exitPos.y)
    };
  }

  getKeyWorldPosition() {
    const keyPos = this.data.getKeyPosition();
    return {
      x: this.gridXToWorldX(keyPos.x),
      y: this.gridYToWorldY(keyPos.y)
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
   * @param playerPos
   * @param tilePos
   * @param allowUnrevealedDestination Whether or not to allow player to move to a destination that
   * is unrevealed. If true, the player can only move to a destination that is one step beyond the
   * currently revealed tiles (i.e. step from a revealed tile to the neighboring unrevealed tile).
   */
  findPathBetween(playerPos: Point, tilePos: Point, allowUnrevealedDestination = false) {
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
    const isDestinationBlocked = !this.pathFinder.isWalkableAt(tilePos.x, tilePos.y);
    if (isDestinationBlocked && allowUnrevealedDestination) {
      this.pathFinder.setWalkableAt(tilePos.x, tilePos.y);
    }
    this.pathFinder.update();
    return this.pathFinder.findPath(playerPos, tilePos);
  }

  fadeLevelOut() {
    this.state = LEVEL_STATE.TRANSITION_OUT;
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

  async fadeLevelIn() {
    this.state = LEVEL_STATE.TRANSITION_IN;
    await this.entrance.open();

    const start = this.getStartingGridPosition();
    this.tiles[start.y][start.x].flipToFront();
    this.getNeighboringTiles(start.x, start.y).map(tile => tile.flipToFront());
    this.state = LEVEL_STATE.RUNNING;
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
    this.data = undefined;
  }
}
