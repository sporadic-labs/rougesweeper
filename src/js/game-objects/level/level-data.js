import { Math as PMath, Geom } from "phaser";
import { default as TILE } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";
import logger from "../../helpers/logger";

const noopTrue = () => true;
const debugTileMap = {
  [TILE.START]: "S",
  [TILE.SHOP]: "s",
  [TILE.ENEMY]: "e",
  [TILE.KEY]: "K",
  [TILE.SCRAMBLE_ENEMY]: "?",
  [TILE.GOLD]: "g",
  [TILE.WALL]: "W",
  [TILE.EXIT]: "X",
  [TILE.BLANK]: "."
};
const tiledShapeToPhaserPoly = (tileWidth, tileHeight, tiledObject) => {
  if (tiledObject.rectangle) {
    const { width, height, x, y } = tiledObject;
    const tx = x / tileWidth;
    const ty = y / tileHeight;
    const tw = width / tileWidth;
    const th = height / tileHeight;
    return new Phaser.Geom.Polygon([[tx, ty], [tx + tw, ty], [tx + tw, ty + th], [tx, ty + th]]);
  } else if (tiledObject.polygon) {
    return new Phaser.Geom.Polygon(
      tiledObject.polygon.map(({ x, y }) => [
        (tiledObject.x + x) / tileWidth,
        (tiledObject.y + y) / tileHeight
      ])
    );
  } else {
    throw new Error("Unsupported Tiled shape:", tiledObject);
  }
};

class DataTile {
  constructor(type, phaserTile) {
    this.type = type;
    this.phaserTile = phaserTile;
  }
}

export default class LevelData {
  /** @param {Phaser.Tilemaps.Tilemap} map */
  constructor(map) {
    this.map = map;
    this.tileWidth = map.tileWidth;
    this.tileHeight = map.tileHeight;

    const groundRect = this.calculateLayerBoundingBox("Tiles");
    this.leftOffset = groundRect.left;
    this.topOffset = groundRect.top;
    this.width = groundRect.width;
    this.height = groundRect.height;
    this.topLeftTile = map.getTileAt(this.leftOffset, this.topOffset, false, "Tiles");

    const tiles = create2DArray(this.width, this.height, undefined);
    this.tiles = tiles;

    // Loop over the board locations within the map to determine the tiles.
    for (let groundX = 0; groundX < this.width; groundX++) {
      for (let groundY = 0; groundY < this.height; groundY++) {
        const mapX = groundRect.left + groundX;
        const mapY = groundRect.top + groundY;

        // Fill in any ground tiles from the "Tiles" layer.
        const groundTile = map.getTileAt(mapX, mapY, false, "Tiles");
        if (groundTile) {
          tiles[groundY][groundX] = new DataTile(TILE.BLANK, groundTile);
        }

        // Fill in another non-ground tiles, which are located within the "Assets" layer and are
        // expected to have a type property that matches TILE_TYPES exactly.
        const assetTile = map.getTileAt(mapX, mapY, false, "Assets");
        if (assetTile) {
          if (assetTile.properties && assetTile.properties.type) {
            const stringType = assetTile.properties.type;
            const parsedType = TILE[stringType];
            if (parsedType) {
              tiles[groundY][groundX] = new DataTile(parsedType, groundTile);
            } else {
              logger.warn(`Unexpected tile type ${stringType} at (${groundX}, ${groundY})`);
            }
          } else {
            logger.warn(`Tile is missing type property at (${groundX}, ${groundY})`);
          }
        }
      }
    }

    const keyLayer = map.getObjectLayer("Random Key");
    if (keyLayer) {
      const keyPosition = this.generateKeyPosition(keyLayer);
      this.setTileAt(keyPosition.x, keyPosition.y, TILE.KEY);
    }

    const scrambleEnemyLayer = map.getObjectLayer("Scramble Enemies");
    if (scrambleEnemyLayer) {
      scrambleEnemyLayer.objects.forEach(({ x, y }) => {
        const tx = x / this.tileWidth;
        const ty = y / this.tileHeight - 1;
        this.setTileAt(tx, ty, TILE.SCRAMBLE_ENEMY);
      });
    }

    const enemiesLayer = map.getObjectLayer("Random Enemies");
    if (enemiesLayer) {
      const enemyPositions = this.generateEnemyPositions(enemiesLayer);
      enemyPositions.forEach(({ x, y }) => this.setTileAt(x, y, TILE.ENEMY));
    }

    this.isExitLocked = this.hasTileOfType(TILE.KEY);
    this.startPosition = this.getPositionOf(TILE.START);
    this.exitPosition = this.getPositionOf(TILE.EXIT);

    this.debugDump();
  }

  /**
   * Calculate the bounding box of all the non-empty tiles within a layer of the map.
   *
   * @param {string} layerName Name of the layer in Tiled to use for the bbox calculation.
   * @memberof LevelData
   */
  calculateLayerBoundingBox(layerName) {
    const bbox = { left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0 };
    let hasFoundLeft = false;
    let hasFoundTop = false;
    let hasFoundRight = false;
    let hasFoundBottom = false;
    const layerData = this.map.getLayer(layerName);
    const rows = layerData.data.length;
    const cols = layerData.data[0].length;

    // Parse the top/left by looping from the top left to bottom right.
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const tile = layerData.data[y][x];
        const isEmpty = tile.index === -1;
        if (isEmpty) continue;
        if (!hasFoundLeft) {
          bbox.left = x;
          hasFoundLeft = true;
        }
        if (!hasFoundTop) {
          bbox.top = y;
          hasFoundTop = true;
        }
        if (hasFoundLeft && hasFoundTop) break;
      }
      if (hasFoundLeft && hasFoundTop) break;
    }

    // Parse the bottom/right by looping from the bottom right to top left.
    for (let y = rows - 1; y >= 0; y--) {
      for (let x = cols - 1; x >= 0; x--) {
        const tile = layerData.data[y][x];
        const isEmpty = tile.index === -1;
        if (isEmpty) continue;
        if (!hasFoundRight) {
          bbox.right = x;
          hasFoundRight = true;
        }
        if (!hasFoundBottom) {
          bbox.bottom = y;
          hasFoundBottom = true;
        }
        if (hasFoundRight && hasFoundBottom) break;
      }
      if (hasFoundRight && hasFoundBottom) break;
    }

    if (!hasFoundBottom || !hasFoundTop || !hasFoundLeft || !hasFoundRight) {
      throw new Error(`Error calculating the bounding box of layer ${layerName}.`);
    }

    bbox.width = bbox.right - bbox.left + 1;
    bbox.height = bbox.bottom - bbox.top + 1;

    return bbox;
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
  generateKeyPosition(objectLayer) {
    const obj = objectLayer.objects.find(
      obj => obj.polygon !== undefined || obj.rectangle === true
    );
    const polygon = tiledShapeToPhaserPoly(this.tileWidth, this.tileHeight, obj);
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
  generateEnemyPositions(objectLayer) {
    // Find the spawning polygons
    const spawnRegions = objectLayer.objects.filter(
      obj => obj.polygon !== undefined || obj.rectangle === true
    );
    const spawnPolygons = spawnRegions.map(obj =>
      tiledShapeToPhaserPoly(this.tileWidth, this.tileHeight, obj)
    );

    // Count enemy tile objects within each region
    const enemyTiles = objectLayer.objects.filter(obj => obj.gid !== undefined);
    const enemyCounts = Array(spawnRegions.length).fill(0);
    enemyTiles.map(enemyTile => {
      const x = enemyTile.x / this.tileWidth + 0.5;
      const y = enemyTile.y / this.tileHeight - 0.5;
      let enemyPlaced = false;
      for (let i = 0; i < spawnPolygons.length; i++) {
        if (spawnPolygons[i].contains(x, y)) {
          enemyPlaced = true;
          enemyCounts[i] += 1;
        }
      }
      if (!enemyPlaced) {
        throw new Error("Enemy does not fit within any of the spawn polygons.");
      }
    });

    // Attempt to find random places for all enemy tiles - inefficient!
    const enemyPositions = [];
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
   * Get the blank tile positions within a given polygon (that is placed and sized in tile
   * coordinates). If a polygon is a rectangle at (1, 1) with a size of 2 x 1, then this method will
   * check (1, 1) and (2, 1), but not (1, 2) or (2, 2).
   *
   * @param {Phaser.Geom.Polygon} polygon
   * @returns [{x, y}]
   * @memberof LevelData
   */
  getBlanksWithin(polygon) {
    const blanks = this.getAllPositionsOf(TILE.BLANK);
    return blanks.filter(p => polygon.contains(p.x + 0.5, p.y + 0.5));
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

  hasTileOfType(tileType) {
    return this.getPositionOf(tileType) ? true : false;
  }

  getPositionOf(tileType) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.tiles[y][x] && this.tiles[y][x].type === tileType) return { x, y };
      }
    }
    return null;
  }

  getAllPositionsOf(tileType) {
    const positions = [];
    this.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile && tile.type === tileType) positions.push({ x, y });
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
