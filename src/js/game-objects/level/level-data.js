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

export default class LevelData {
  /** @param {Phaser.Tilemaps.Tilemap} map */
  constructor(map) {
    const { width, height } = map;

    // For the gameboard, we are just using tiled to lay out levels, not load tile images. So,
    // we need to parse the Tile IDs to an enum value as a way to identify each tile in the board.
    const firstId = map.getTileset("tiles").firstgid;
    const tilesetIDToEnum = {
      [firstId + 0]: TILE.WALL,
      [firstId + 1]: TILE.EXIT,
      [firstId + 2]: TILE.SHOP,
      [firstId + 5]: TILE.BLANK,
      [firstId + 6]: TILE.ENEMY,
      [firstId + 7]: TILE.START,
      [firstId + 8]: TILE.EXIT,
      [firstId + 9]: TILE.KEY
    };

    this.tileWidth = map.tileWidth;
    this.tileHeight = map.tileHeight;

    const tiles = create2DArray(width, height, undefined);
    this.tiles = tiles;

    // Loop over the ground layer, filling in all blanks
    map.setLayer("Tiles");
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        if (map.getTileAt(x, y)) tiles[y][x] = TILE.BLANK;
      }
    }

    // Loop over the foreground to place any non-blank tiles
    map.setLayer("Assets");
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = map.getTileAt(x, y);
        if (tile) {
          const type = tilesetIDToEnum[tile.index];
          if (type !== undefined) tiles[y][x] = type;
          else logger.warn("Unexpected tile index in map");
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

    // Calculate top & left offset and trim map AFTER parsing everything from the Tiled map.
    let leftOffset = 0;
    let topOffset = 0;
    map.setLayer("Board");
    this.tiles = this.tiles
      .map(row =>
        row.filter((value, i) => {
          if (value && !leftOffset) leftOffset = i;
          return value;
        })
      )
      .filter((row, i) => {
        const empty = row.length === 0;
        if (!empty && !topOffset) topOffset = i;
        return !empty;
      });
    this.leftOffset = leftOffset;
    this.topOffset = topOffset;
    this.width = this.tiles[0].length;
    this.height = this.tiles.length;
    this.topLeftTile = map.getTileAt(leftOffset, topOffset);

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
    // TODO: may need to use our own bbox object. Phaser's has the correct top/left/bottom/right,
    // but the width and height are off by one.
    const bbox = new Geom.Rectangle(0, 0, 0, 0);
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
        if (this.tiles[y][x] === tileType) return { x, y };
      }
    }
    return null;
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
