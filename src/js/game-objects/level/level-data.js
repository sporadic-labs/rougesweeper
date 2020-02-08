import { Math as PMath, Geom } from "phaser";
import { default as TILE } from "./tile-types";
import { create2DArray } from "../../helpers/array-utils";
import logger from "../../helpers/logger";

const noopTrue = () => true;
const debugTileMap = {
  [TILE.ENTRANCE]: "S",
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
    return new Phaser.Geom.Polygon([
      [tx, ty],
      [tx + tw, ty],
      [tx + tw, ty + th],
      [tx, ty + th]
    ]);
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

    // Create a map that goes from our type property on the tileset in Tiled to our TileType enum in
    // JS.
    const tileset = this.map.getTileset("assets");
    const tileTypeToId = {};
    for (const tileId in tileset.tileProperties) {
      const props = tileset.tileProperties[tileId];
      if (props.type) {
        tileTypeToId[props.type] = tileset.firstgid + Number.parseInt(tileId, 10);
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
              tiles[groundY][groundX] = new DataTile(parsedType, assetTile);
            } else {
              logger.warn(`Unexpected tile type ${stringType} at (${groundX}, ${groundY})`);
            }
          } else {
            logger.warn(`Tile is missing type property at (${groundX}, ${groundY})`);
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
    this.exitPosition = {
      x: exitTile.x - this.leftOffset - 1,
      y: exitTile.y - this.topOffset
    };
    tiles[this.exitPosition.y][this.exitPosition.x] = new DataTile(TILE.EXIT, exitTile);

    // Locate the top tile of the entrance door from the "Decorations" layer.
    this.map.setLayer("Decorations");
    const entranceTile = this.map.findTile(tile => tile.properties.doorEntrance);
    if (!entranceTile) {
      throw new Error(`No exit door (w/ property "doorEntrance") found in the "Decorations" layer`);
    }
    // Translate tile position in Tiled to grid. In this case, we don't need an offset.
    this.entrancePosition = {
      x: entranceTile.x - this.leftOffset,
      y: entranceTile.y - this.topOffset
    };
    tiles[this.entrancePosition.y][this.entrancePosition.x] = new DataTile(
      TILE.ENTRANCE,
      entranceTile
    );

    const keyLayer = map.getObjectLayer("Random Key");
    if (keyLayer) {
      const { x, y } = this.generateKeyPosition(keyLayer);
      const tile = this.map.putTileAt(tileTypeToId[TILE.KEY], x, y, false, "Assets");
      // Annoying bug(?) in Phaser where newly created tiles don't get the properties from the
      // tileset, which we need, so copy them manually:
      tile.properties = this.map.getTileset("assets").getTileProperties(tile.index);
      this.tiles[y][x] = new DataTile(TILE.KEY, tile);
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
      console.log(enemyPositions);
      enemyPositions.forEach(({ x, y }) => this.setTileAt(x, y, TILE.ENEMY));
    }

    this.isExitLocked = this.hasTileOfType(TILE.KEY);

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
    console.log(polygon);
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

    console.log(spawnPolygons);

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
      console.log(polygon);
      const blanks = this.getBlanksWithin(polygon);
      console.log(blanks);
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
    console.log(blanks);
    return blanks.filter(p =>
      polygon.contains(p.x + this.leftOffset + 0.5, p.y + this.topOffset + 0.5)
    );
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
    // this.tiles[y][x] = tile;
    // this.tiles[y][x] = { type: tile };

    const groundTile = this.map.getTileAt(x, y, false, "Tiles");
    if (groundTile) {
      this.tiles[y][x] = new DataTile(tile, groundTile);
    }

    console.log(this.tiles);
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
    const debugTiles = this.tiles.map(row =>
      row.map(tile => (tile ? debugTileMap[tile.type] : " "))
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
    console.log(`${grid}\n${stats}`);
  }
}
