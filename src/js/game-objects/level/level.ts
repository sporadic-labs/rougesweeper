import Phaser, { Tilemaps, Scene, GameObjects } from "phaser";
import TILE_TYPES, { isEnemyTile } from "../level/tile-types";
import Tile, { TileFlipToBackInput, TileFlipToFrontInput } from "./tile";
import LevelData from "./level-data";
import PathFinder from "./path-finder";
import DEPTHS from "../depths";
import { gameCenter } from "../../game-dimensions";
import Door, { DOOR_PLACEMENT } from "./door";
import { getTilesetName, getTileFrame } from "./get-map-asset-names";
import DialogueManager from "../hud/dialogue-manager";
import { Point } from "../../helpers/common-interfaces";
import EventEmitter from "../../helpers/event-emitter";
import LEVEL_EVENTS, { LevelEmitter } from "./events";
import { neighborOffsets } from "./neighbor-offsets";
import RandomPickupManager from "./random-pickup-manager";
import { levelData as allLevelData } from "../../store/levels";
import SoundManager from "../sound-manager";

const wait = ({ scene, delayMs }: { scene: Phaser.Scene; delayMs: number }) =>
  new Promise<void>((resolve) => {
    scene.time.delayedCall(delayMs, () => resolve());
  });

const filterToDefinedTiles = (tiles: Array<Tile | null> | Array<Array<Tile | null>>) =>
  tiles.flat().filter((t): t is Tile => !!t);

/**
 * Sort an array of tiles by row first and then by column, so that the resulting
 * array is sorted top to bottom and then left to right.
 */
const sortTiles = (tiles: Array<Tile>) =>
  tiles.slice().sort((a, b) => {
    if (b.gridY > a.gridY) {
      return -1;
    } else if (b.gridY < a.gridY) {
      return 1;
    } else if (b.gridX > a.gridX) {
      return -1;
    } else if (b.gridX < a.gridX) {
      return 1;
    } else {
      return 0;
    }
  });

const Distance = Phaser.Math.Distance.BetweenPoints;

enum LEVEL_STATE {
  TRANSITION_IN = "TRANSITION_IN",
  RUNNING = "RUNNING",
  TRANSITION_OUT = "TRANSITION_OUT",
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
  private tiles: Array<Array<Tile | null>>;
  private state: LEVEL_STATE = LEVEL_STATE.TRANSITION_IN;
  private tileKey: string;

  constructor(
    private scene: Scene,
    private levelKey: string,
    private dialogueManager: DialogueManager,
    private randomPickupManager: RandomPickupManager,
    private sound: SoundManager
  ) {
    this.tileKey = getTileFrame(levelKey);

    // Set up the tilemap with necessary statics graphics layers, i.e. everything but the gameboard.
    this.map = scene.add.tilemap(levelKey);

    this.randomPickupManager = randomPickupManager;

    const tilesSetImage = this.map.addTilesetImage(getTilesetName(this.map));

    this.map.layers.forEach((layerData) => {
      // TODO: standardize Tiled structure. Ignoring the dynamic gameboard stuff.
      let tileSet = tilesSetImage;
      let depth = DEPTHS.BOARD;
      if (layerData.name === "Decorations") {
        tileSet = this.map.addTilesetImage("decorations");
        depth = DEPTHS.BOARD;
      }
      const layer = this.map.createLayer(layerData.name, tileSet);
      layer.setPosition(
        gameCenter.x - layer.displayWidth / 2,
        gameCenter.y - layer.displayHeight / 2
      );
      layer.setDepth(depth);
    });

    this.data = new LevelData(levelKey, this.map, this.randomPickupManager);
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

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((dataTile, x) => {
        if (!dataTile || !dataTile.type) return null;

        const { type, phaserTile, isReachable } = dataTile;
        const { frameName } = phaserTile.properties;

        if (type === TILE_TYPES.EXIT) {
          // Find the center world position of the whole door (which is 2 tall) from the top tile.
          this.exitWorldPosition = {
            x: phaserTile.getCenterX(),
            y: phaserTile.getBottom(),
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
            frameName,
            isOpen,
            DOOR_PLACEMENT.RIGHT,
            this.tileKey
          );
          return null;
        } else if (type === TILE_TYPES.ENTRANCE) {
          // Find the center world position of the whole door (which is 2 tall) from the top tile.
          this.entranceWorldPosition = {
            x: phaserTile.getCenterX(),
            y: phaserTile.getBottom(),
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
            frameName,
            isOpen,
            DOOR_PLACEMENT.LEFT,
            this.tileKey
          );
          return null;
        }

        const tile = new Tile(
          scene,
          this.tileKey,
          type,
          frameName,
          this.gridXToWorldX(x),
          this.gridYToWorldY(y),
          this,
          isReachable,
          this.sound
        );
        tile.setGridPosition(x, y);
        tile.enableInteractive();
        return tile;
      })
    );
  }

  onTileContentsUpdated(tile: Tile) {
    if (tile.isCurrentlyBlank && tile.type === TILE_TYPES.SCRAMBLE_ENEMY) {
      if (!this.isTileScrambled(tile.gridX, tile.gridY)) {
        tile.clearScramble();
      }
      for (let x = 0; x < this.data.width; x++) {
        const t = this.getTileFromGrid(x, tile.gridY);
        if (t && !this.isTileScrambled(t.gridX, t.gridY)) {
          t.clearScramble();
        }
      }
      for (let y = 0; y < this.data.height; y++) {
        const t = this.getTileFromGrid(tile.gridX, y);
        if (t && !this.isTileScrambled(t.gridX, t.gridY)) {
          t.clearScramble();
        }
      }
    }
  }

  onTileFlip(tile: Tile) {
    // Avoid expensive checks on every tile when we are fading out and flipping all the tiles.
    if (this.state !== LEVEL_STATE.RUNNING) return;

    if (this.isTileScrambled(tile.gridX, tile.gridY)) {
      tile.scramble();
    }

    // If the revealed tile is a wall, then it's time to check its neighbors to see if they are
    // unreachable and need to be flipped now.
    if (tile.isRevealed && tile.type === TILE_TYPES.WALL) {
      const { x, y } = tile.getGridPosition();
      this.getNeighboringTiles(x, y).forEach((tile) => {
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
    this.getNeighboringTiles(gridX, gridY).forEach((tile) => {
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
    const checkTile = (x: number, y: number) => {
      const tile = this.getTileFromGrid(x, y);
      if (!tile) return "continue";
      const type = tile.getCurrentTileType();
      if (type === TILE_TYPES.WALL) return "blocked";
      if (type === TILE_TYPES.SCRAMBLE_ENEMY) return "scrambled";
      return "continue";
    };

    const result = checkTile(x, y);
    // If target tile is a wall, no scramble possible.
    if (result === "blocked") return false;
    if (result === "scrambled") return true;

    for (let i = 1; i <= x; i++) {
      const result = checkTile(x - i, y);
      // Stop looking in this direction when you hit a wall.
      if (result === "blocked") break;
      if (result === "scrambled") return true;
    }
    for (let i = 1; i < this.data.width - x; i++) {
      const result = checkTile(x + i, y);
      if (result === "blocked") break;
      if (result === "scrambled") return true;
    }
    for (let i = 1; i <= y; i++) {
      const result = checkTile(x, y - i);
      if (result === "blocked") break;
      if (result === "scrambled") return true;
    }
    for (let i = 1; i < this.data.height - y; i++) {
      const result = checkTile(x, y + i);
      if (result === "blocked") break;
      if (result === "scrambled") return true;
    }

    return false;
  }

  countNeighboringEnemies(x: number, y: number) {
    const enemyCount = this.getNeighboringTiles(x, y).reduce((count, tile) => {
      const isEnemy = isEnemyTile(tile.type);
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
    return filterToDefinedTiles(tiles);
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
      y: this.gridYToWorldY(exitPos.y),
    };
  }

  getKeyWorldPosition() {
    const keyPos = this.data.getKeyPosition();
    return {
      x: this.gridXToWorldX(keyPos.x),
      y: this.gridYToWorldY(keyPos.y),
    };
  }

  gridXYToWorldXY(pos: Point) {
    return {
      x: this.gridXToWorldX(pos.x),
      y: this.gridYToWorldY(pos.y),
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
    this.forEachTile((tile) => tile.enableInteractive());
  }

  disableAllTiles() {
    this.forEachTile((tile) => tile.disableInteractive());
  }

  /**
   * Runs the given callback for each tile that exists in the map
   * @param {function} cb
   */
  forEachTile(cb: (t: Tile) => void) {
    filterToDefinedTiles(this.tiles).forEach((tile) => {
      cb(tile);
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
        if (tile && tile.isRevealed && tile.isCurrentlyBlank && tile.type !== TILE_TYPES.WALL) {
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

  async fadeLevelOut() {
    this.state = LEVEL_STATE.TRANSITION_OUT;
    const tilePromises: Promise<void>[] = [];
    tilePromises.push(this.flipAllTiles("front"));
    // Flip all to the front, then half a second later, kick off the fade out from left to right
    filterToDefinedTiles(this.tiles).forEach((tile) =>
      tilePromises.push(tile.fadeTileOut(250, 500 + tile.gridX * 50))
    );
    await Promise.all(tilePromises);
  }

  /**
   * Flip tiles to the front or back in a batch. This is done so that we can
   * play sound effects in a way that doesn't overwhelm the audio channel and
   * cause clipping.
   */
  async flipTileBatch({
    tiles,
    flipDirection,
    staggerMs = 100,
    ...args
  }:
    | ({
        tiles: Array<Tile>;
        staggerMs?: number;
        flipDirection: "front";
      } & TileFlipToFrontInput)
    | ({
        tiles: Array<Tile>;
        staggerMs?: number;
        flipDirection: "back";
      } & TileFlipToBackInput)) {
    // If we are flipping 9 or less tiles, we can stagger each tile. If we are
    // flipping more than that, we should flip row by row to speed things up.
    const waitBehavior = tiles.length > 9 ? "row" : "each";
    const sortedTiles = sortTiles(tiles);
    const flipPromises = [];
    let lastRow: null | number = null;
    let i = 0;
    for (const tile of sortedTiles) {
      // No need to delay on the 1st tile.
      if (i !== 0) {
        // Always wait for "each", but only wait on the 1st tile in the row for
        // "row" behavior.
        const shouldWait = waitBehavior === "row" ? lastRow !== tile.gridY : true;
        if (shouldWait) {
          await wait({ scene: this.scene, delayMs: staggerMs });
        }
      }

      // Play a sound on each new row, or each tile.
      const triggerSound = waitBehavior === "row" ? lastRow !== tile.gridY : true;
      if (flipDirection === "front") {
        flipPromises.push(
          flipDirection === "front"
            ? tile.flipToFront({ ...args, playSfx: triggerSound })
            : tile.flipToBack({ ...args, playSfx: triggerSound })
        );
      }
      lastRow = tile.gridY;
      i++;
    }
    await Promise.all(flipPromises);
  }

  async flipAllTiles(flipDirection: "front" | "back" = "front") {
    const tilesToFlip = filterToDefinedTiles(this.tiles).filter((tile) => {
      return (
        (tile.isRevealed && flipDirection === "back") ||
        (tile && !tile.isRevealed && flipDirection === "front")
      );
    });

    await this.flipTileBatch({
      tiles: tilesToFlip,
      flipDirection,
      staggerMs: 100,
    });
  }

  async fadeLevelIn() {
    this.state = LEVEL_STATE.TRANSITION_IN;
    await this.entrance.open();

    const start = this.getStartingGridPosition();
    const tiles = filterToDefinedTiles([
      this.tiles[start.y][start.x],
      ...this.getNeighboringTiles(start.x, start.y),
    ]);
    await this.flipTileBatch({ tiles, flipDirection: "front", staggerMs: 100 });
    this.state = LEVEL_STATE.RUNNING;
    this.events.emit(LEVEL_EVENTS.LEVEL_START, this);
  }

  isLastLevel(): boolean {
    const levelData = allLevelData.find((data) => data.level === this.levelKey);
    return Boolean(levelData ? levelData.isLastLevel : false);
  }

  destroy() {
    filterToDefinedTiles(this.tiles).forEach((tile) => tile.destroy());
    this.entrance.destroy();
    this.exit.destroy();
    this.map.destroy();
    this.events.destroy();
  }
}
