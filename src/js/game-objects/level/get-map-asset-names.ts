export enum LevelTilesetName {
  hq = "hq",
  lab = "lab",
  warehouse = "warehouse",
  skyscraper = "skyscraper",
  temple = "temple",
  jungle = "jungle",
}

export const levelTilesetNames = Object.values(LevelTilesetName);

export function isTilesetName(str: string): str is LevelTilesetName {
  return levelTilesetNames.includes(str as LevelTilesetName);
}

export function getTilesetName(map: Phaser.Tilemaps.Tilemap): LevelTilesetName {
  const tileset = map.tilesets.find((tileset) => isTilesetName(tileset.name));

  if (!tileset) {
    console.error(
      `No known level tileset found in this map. Valid names are ${levelTilesetNames.join(", ")}`
    );
    return LevelTilesetName.hq;
  }

  return tileset.name as LevelTilesetName;
}

export function getTileFrame(levelKey: string): string {
  switch (levelKey.slice(0, 8)) {
    case "level-00":
    case "level-01":
    case "level-02":
    case "level-03":
      return "tile-hq";
    case "level-04":
    case "level-05":
    case "level-06":
      return "tile-warehouse";
    case "level-07":
    case "level-08":
    case "level-09":
      return "tile-lab";
    case "level-10":
      return "tile-skyscraper";
    case "level-11":
      return "tile-temple";
    case "level-12":
      return "tile-jungle";
    default:
      throw Error(
        `Unrecognized level key ${levelKey} - unable to determine the corresponding tile fame name.`
      );
  }
}
