import { Math as PMath, Tilemaps, Geom } from "phaser";
import TILE_TYPES, { default as TILE, tileTypeToDebugCharacter } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";
import logger from "../../helpers/logger";
import { Point } from "../../helpers/common-interfaces";

const noopFilter = (x: number, y: number) => true;
type TiledObject = Phaser.Types.Tilemaps.TiledObject;

class DataTile {
  constructor(public type: TILE, public phaserTile: Tilemaps.Tile) {}
}

type TileProperty = { type?: TILE; frameName?: string };
type TilesetProperty = { [key: string]: TileProperty };
type TileTypeToTileIdMap = { [tileType in TILE]?: number };

export default class LevelData {
  public topOffset: number;
  public leftOffset: number;
  public width: number;
  public height: number;
  public exitPosition: Point;
  public entrancePosition: Point;
  public tiles: DataTile[][];
  private tileWidth: number;
  private tileHeight: number;
  private tileTypeToId: TileTypeToTileIdMap;

  constructor(private map: Tilemaps.Tilemap) {
    this.map = map;
    this.tileWidth = map.tileWidth;
    this.tileHeight = map.tileHeight;

    // Create a map that goes from our type property on the tileset in Tiled to our TileType enum in
    // JS.
    const tileset = this.map.getTileset("assets");
    const tilesetProperties = tileset.tileProperties as TilesetProperty;
    this.tileTypeToId = {};
    for (const tileId in tilesetProperties) {
      const props = tilesetProperties[tileId];
      if (props.type) {
        const id = Number.parseInt(tileId, 10);
        this.tileTypeToId[props.type] = tileset.firstgid + id;
      }
    }

    const groundRect = this.calculateLayerBoundingBox("Tiles");
    this.leftOffset = groundRect.left;
    this.topOffset = groundRect.top;
    this.width = groundRect.width;
    this.height = groundRect.height;

    const tiles = create2DArray(this.width, this.height, undefined);
    this.tiles = tiles;

    // Loop over the board locations within the map to determine the tiles.
    for (let boardX = 0; boardX < this.width; boardX++) {
      for (let boardY = 0; boardY < this.height; boardY++) {
        const { x: mapX, y: mapY } = this.boardPositionToTilemapPosition(boardX, boardY);

        // Fill in any ground tiles from the "Tiles" layer.
        const groundTile = map.getTileAt(mapX, mapY, false, "Tiles");
        if (groundTile) {
          tiles[boardY][boardX] = new DataTile(TILE.BLANK, groundTile);
        }

        // Fill in another non-ground tiles, which are located within the "Assets" layer and are
        // expected to have a type property that matches TILE_TYPES exactly.
        const assetTile = map.getTileAt(mapX, mapY, false, "Assets");
        if (assetTile) {
          const props = assetTile.properties as TileProperty;
          if (props && props.type) {
            const parsedType = TILE[props.type];
            if (parsedType) {
              tiles[boardY][boardX] = new DataTile(parsedType, assetTile);
            } else {
              logger.warn(`Unexpected tile type ${props.type} at (${boardX}, ${boardY})`);
            }
          } else {
            logger.warn(`Tile is missing type property at (${boardX}, ${boardY})`);
          }
        }
      }
    }

    // Locate the top tile of the exit door from the "Decorations" layer.
    this.map.setLayer("Decorations");
    const exitTile = this.map.findTile(tile => tile.properties.doorExit);
    if (!exitTile) {
      throw new Error(`No exit door (w/ property "doorExit") found in the "Decorations" layer`);
    }
    // Translating from tile position in Tiled to our custom grid position is a little tricky. The
    // "Decorations" layer has a negative offset, so it is effectively offset one tile to the left
    // and one tile to the right when it comes to grid positions.
    this.exitPosition = this.tileToBoardPosition(exitTile);
    this.exitPosition.x -= 1;
    tiles[this.exitPosition.y][this.exitPosition.x] = new DataTile(TILE.EXIT, exitTile);

    // Locate the top tile of the entrance door from the "Decorations" layer.
    this.map.setLayer("Decorations");
    const entranceTile = this.map.findTile(tile => tile.properties.doorEntrance);
    if (!entranceTile) {
      throw new Error(`No exit door (w/ property "doorEntrance") found in the "Decorations" layer`);
    }
    // Translate tile position in Tiled to grid. In this case, we don't need an offset.
    this.entrancePosition = this.tileToBoardPosition(entranceTile);
    tiles[this.entrancePosition.y][this.entrancePosition.x] = new DataTile(
      TILE.ENTRANCE,
      entranceTile
    );

    const keyLayer = map.getObjectLayer("Random Key");
    if (keyLayer) {
      const { x, y } = this.generateKeyPosition(keyLayer);
      this.setTileAt(x, y, TILE.KEY);
    }

    const scrambleEnemyLayer = map.getObjectLayer("Scramble Enemies");
    if (scrambleEnemyLayer) {
      scrambleEnemyLayer.objects.forEach(({ x, y }) => {
        const tx = x / this.tileWidth - this.leftOffset;
        const ty = y / this.tileHeight - 1 - this.topOffset;
        this.setTileAt(tx, ty, TILE.SCRAMBLE_ENEMY);
      });
    }

    const enemiesLayer = map.getObjectLayer("Random Enemies");
    if (enemiesLayer) {
      const enemyPositions = this.generateEnemyPositions(enemiesLayer);
      enemyPositions.forEach(({ x, y }) => this.setTileAt(x, y, TILE.ENEMY));
    }

    this.debugDump();
  }

  /**
   * Convert from the board position (relative to top left of the ground tile area) to tilemap
   * position (relative to the top left of the whole tilemap).
   * @param boardX
   * @param boardY
   */
  boardPositionToTilemapPosition(boardX: number, boardY: number): Point {
    return { x: boardX + this.leftOffset, y: boardY + this.topOffset };
  }

  /**
   * Convert from tilemap position (relative to the top left of the whole tilemap) to the board
   * position (relative to top left of the ground tile area).
   * @param mapX
   * @param mapY
   */
  tilemapPositionToBoardPosition(mapX: number, mapY: number): Point {
    return { x: mapX - this.leftOffset, y: mapY - this.topOffset };
  }

  /**
   * Convert from a tile's position (relative to the top left of the whole tilemap) to the board
   * position (relative to top left of the ground tile area).
   * @param x
   * @param y
   */
  tileToBoardPosition(tile: Tilemaps.Tile): Point {
    return this.tilemapPositionToBoardPosition(tile.x, tile.y);
  }

  doesLevelHaveKey() {
    return this.hasTileOfType(TILE.KEY);
  }

  getKeyPosition() {
    return this.getPositionOf(TILE.KEY);
  }

  /**
   * Calculate the bounding box of all the non-empty tiles within a layer of the map.
   *
   * @param {string} layerName Name of the layer in Tiled to use for the bbox calculation.
   * @memberof LevelData
   */
  calculateLayerBoundingBox(layerName: string) {
    const bbox = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    let hasFoundLeft = false;
    let hasFoundTop = false;
    let hasFoundRight = false;
    let hasFoundBottom = false;
    const layerData = this.map.getLayer(layerName);
    const rows = layerData.data.length;
    const cols = layerData.data[0].length;

    // Find the leftmost tile by going column by column from the left.
    for (let x = 0; x < cols; x++) {
      for (let y = 0; y < rows; y++) {
        const isEmpty = layerData.data[y][x].index === -1;
        if (!isEmpty) {
          bbox.left = x;
          hasFoundLeft = true;
          break;
        }
      }
      if (hasFoundLeft) break;
    }

    // Find the rightmost tile by going column by column from the right.
    for (let x = cols - 1; x >= 0; x--) {
      for (let y = 0; y < rows; y++) {
        const isEmpty = layerData.data[y][x].index === -1;
        if (!isEmpty) {
          bbox.right = x;
          hasFoundRight = true;
          break;
        }
      }
      if (hasFoundRight) break;
    }

    // Find the topmost tile by going row by row from the top.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const isEmpty = layerData.data[y][x].index === -1;
        if (!isEmpty) {
          bbox.top = y;
          hasFoundTop = true;
          break;
        }
      }
      if (hasFoundTop) break;
    }

    // Find the bottommost tile by going row by row from the bottom.
    for (let y = rows - 1; y >= 0; y--) {
      for (let x = 0; x < cols; x++) {
        const isEmpty = layerData.data[y][x].index === -1;
        if (!isEmpty) {
          bbox.bottom = y;
          hasFoundBottom = true;
          break;
        }
      }
      if (hasFoundBottom) break;
    }

    if (!hasFoundBottom || !hasFoundTop || !hasFoundLeft || !hasFoundRight) {
      throw new Error(`Error calculating the bounding box of layer ${layerName}.`);
    }

    bbox.width = bbox.right - bbox.left + 1;
    bbox.height = bbox.bottom - bbox.top + 1;

    return bbox;
  }

  /**
   * Convert a rectangle or polygon TiledObject to a Phaser Polygon in board position.
   * @param tiledObject
   */
  tiledShapeToPhaserPoly(tiledObject: TiledObject) {
    const { tileWidth, tileHeight } = this;
    const { x, y } = tiledObject;
    if (tiledObject.rectangle) {
      const { width, height } = tiledObject;
      const tx = x / tileWidth;
      const ty = y / tileHeight;
      const tw = width / tileWidth;
      const th = height / tileHeight;
      const topLeft = this.tilemapPositionToBoardPosition(tx, ty);
      const topRight = this.tilemapPositionToBoardPosition(tx + tw, ty);
      const bottomRight = this.tilemapPositionToBoardPosition(tx + tw, ty + th);
      const bottomLeft = this.tilemapPositionToBoardPosition(tx, ty + th);
      return new Phaser.Geom.Polygon([
        new Geom.Point(topLeft.x, topLeft.y),
        new Geom.Point(topRight.x, topRight.y),
        new Geom.Point(bottomRight.x, bottomRight.y),
        new Geom.Point(bottomLeft.x, bottomLeft.y)
      ]);
    } else if (tiledObject.polygon) {
      return new Phaser.Geom.Polygon(
        tiledObject.polygon.map(point => {
          const mapX = (x + point.x) / tileWidth;
          const mapY = (y + point.y) / tileHeight;
          const boardPos = this.tilemapPositionToBoardPosition(mapX, mapY);
          return new Geom.Point(boardPos.x, boardPos.y);
        })
      );
    } else {
      throw new Error(`Unsupported Tiled shape:\n${JSON.stringify(tiledObject, null, 4)}`);
    }
  }

  /**
   * Generate a location for the exit key based on the given object layer from Tiled. This expects
   * there to be a single polygon object within the layer which defines the region in which the key
   * can spawn.
   *
   * @param {Phaser.Tilemaps.ObjectLayer} objectLayer
   * @returns {{x,y}|undefined}
   * @memberof LevelData
   */
  generateKeyPosition(objectLayer: Tilemaps.ObjectLayer) {
    const obj = objectLayer.objects.find(
      obj => obj.polygon !== undefined || obj.rectangle === true
    );
    const polygon = this.tiledShapeToPhaserPoly(obj);
    const blanks = this.getBlanksWithin(polygon);
    const keyPosition = Phaser.Math.RND.pick(blanks);
    if (!keyPosition) throw new Error("Could not find a valid place to put a key.");
    return keyPosition;
  }

  /**
   * Generate an array of locations for the enemy positions based on the given object layer from
   * Tiled. This expects there to be one or more polygon objects within the layer which defines the
   * spawning regions. This also expects there to be tile objects placed within the bounds of each
   * spawn region, where the number of tile objects indicates how many enemies should be spawned in
   * that region.
   *
   * @param {Phaser.Tilemaps.ObjectLayer} objectLayer
   * @returns {{x,y}|undefined}
   * @memberof LevelData
   */
  generateEnemyPositions(objectLayer: Tilemaps.ObjectLayer) {
    // Find the spawning polygons
    const spawnRegions = objectLayer.objects.filter(
      obj => obj.polygon !== undefined || obj.rectangle === true
    );
    const spawnPolygons = spawnRegions.map(obj => this.tiledShapeToPhaserPoly(obj));

    // Count enemy tile objects within each region
    const enemyTiles = objectLayer.objects.filter(obj => obj.gid !== undefined);
    const enemyCounts = Array(spawnRegions.length).fill(0);
    enemyTiles.map(enemyTile => {
      const x = enemyTile.x / this.tileWidth + 0.5;
      const y = enemyTile.y / this.tileHeight - 0.5;
      const boardPos = this.tilemapPositionToBoardPosition(x, y);
      let enemyPlaced = false;
      for (let i = 0; i < spawnPolygons.length; i++) {
        if (spawnPolygons[i].contains(boardPos.x, boardPos.y)) {
          enemyPlaced = true;
          enemyCounts[i] += 1;
        }
      }
      if (!enemyPlaced) {
        throw new Error("Enemy does not fit within any of the spawn polygons.");
      }
    });

    // Attempt to find random places for all enemy tiles - inefficient!
    const enemyPositions: Point[] = [];
    spawnPolygons.forEach((polygon, i) => {
      const blanks = this.getBlanksWithin(polygon);
      Phaser.Utils.Array.Shuffle(blanks);
      const count = enemyCounts[i];
      if (blanks.length < count) {
        throw new Error("Not enough blanks to spawn an enemy in the region.");
      }
      enemyPositions.push(...blanks.slice(0, count));
    });
    return enemyPositions;
  }

  /**
   * Get the blank tile positions within a given polygon (that is placed and sized in board
   * coordinates). If a polygon is a rectangle at (1, 1) with a size of 2 x 1, then this method will
   * check (1, 1) and (2, 1), but not (1, 2) or (2, 2).
   *
   * @param {Phaser.Geom.Polygon} polygon
   * @returns [{x, y}]
   * @memberof LevelData
   */
  getBlanksWithin(polygon: Geom.Polygon) {
    const blanks = this.getAllPositionsOf(TILE.BLANK);
    return blanks.filter(p => polygon.contains(p.x + 0.5, p.y + 0.5));
  }

  /**
   * Set the tile in the "Assets" layer at the given XY position (relative to offset).
   * @param boardX
   * @param boardY
   * @param type
   */
  setTileAt(boardX: number, boardY: number, type: TILE) {
    const id = this.tileTypeToId[type];
    if (!id) throw Error(`setTileAt: No valid tile index found for type ${type}.`);
    const mapPos = this.boardPositionToTilemapPosition(boardX, boardY);
    const tile = this.map.putTileAt(id, mapPos.x, mapPos.y, false, "Assets");
    // Annoying bug(?) in Phaser where newly created tiles don't get the properties from the
    // tileset, which we need, so copy them manually:
    tile.properties = this.map.getTileset("assets").getTileProperties(id);
    this.tiles[boardY][boardX] = new DataTile(type, tile);
  }

  getTileAt(boardX: number, boardY: number) {
    return this.tiles[boardY][boardX];
  }

  hasTileOfType(tileType: TILE) {
    return this.getPositionOf(tileType) ? true : false;
  }

  getPositionOf(tileType: TILE) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x] && this.tiles[y][x].type === tileType) return { x, y };
      }
    }
    return null;
  }

  getAllPositionsOf(tileType: TILE) {
    const positions: Point[] = [];
    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile && tile.type === tileType) positions.push({ x, y });
      });
    });
    return positions;
  }

  debugDump() {
    const debugTiles = this.tiles.map(row =>
      row.map(tile => (tile ? tileTypeToDebugCharacter[tile.type] : " "))
    );
    const grid = debugTiles.map(row => row.join(" ")).join("\n");
    const flatTiles = this.tiles.flat(1);
    const numTiles = flatTiles.filter(t => t && t.type !== undefined).length;
    const numEnemy = flatTiles.filter(t => t && t.type === TILE.ENEMY).length;
    const numBlank = flatTiles.filter(t => t && t.type === TILE.BLANK).length;
    const numGold = flatTiles.filter(t => t && t.type === TILE.GOLD).length;
    const numWall = flatTiles.filter(t => t && t.type === TILE.WALL).length;
    const stats =
      `Num tiles: ${numTiles}\n` +
      `Enemy tiles: ${numEnemy} (${((numEnemy / numTiles) * 100).toFixed(2)}%)\n` +
      `Blank tiles: ${numBlank} (${((numBlank / numTiles) * 100).toFixed(2)}%)\n` +
      `Gold tiles: ${numGold} (${((numGold / numTiles) * 100).toFixed(2)}%)\n` +
      `Wall tiles: ${numWall} (${((numWall / numTiles) * 100).toFixed(2)}%)`;
    logger.log(`${grid}\n${stats}`);
  }
}
