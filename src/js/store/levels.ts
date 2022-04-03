/**
 * Level and tile data for tilemaps and dialogue info.
 */
const levelData: Array<{
  level: string;
  title: string;
  subtitle: string;
  tiles: Array<{ x: number; y: number }>;
}> = [
  {
    level: "level-01",
    title: "Headquarters",
    subtitle: "Floor 1",
    tiles: [],
  },
  {
    level: "level-02",
    title: "Headquarters",
    subtitle: "Floor 2",
    tiles: [],
  },
  {
    level: "level-03",
    title: "Headquarters",
    subtitle: "Floor 3",
    tiles: [],
  },
  { level: "level-04", title: "Laboratory", subtitle: "Floor 4", tiles: [] },
  { level: "level-05", title: "Laboratory", subtitle: "Floor 5", tiles: [] },
  { level: "level-06", title: "Laboratory", subtitle: "Floor 6", tiles: [] },
  { level: "level-07", title: "Warehouse", subtitle: "Floor 7", tiles: [] },
  { level: "level-08", title: "Warehouse", subtitle: "Floor 8", tiles: [] },
  { level: "level-09", title: "Warehouse", subtitle: "Floor 9", tiles: [] },
  { level: "level-10", title: "Skyscraper", subtitle: "Floor 10", tiles: [] },
  { level: "level-11", title: "Temple", subtitle: "Floor 11", tiles: [] },
];

/**
 * Keys for levels loaded into Phaser, used to access tilemap info.
 */
const levelKeys = levelData.map(({ level }) => level);

/**
 * Loads the JSON files using the key and path from the `levelData` array.
 * @param scene
 */
function loadLevels(scene: Phaser.Scene) {
  scene.load.image("all-assets", "maps/tilesets/all-assets.png");
  scene.load.image("hq", "maps/tilesets/hq.png");
  scene.load.image("warehouse", "maps/tilesets/warehouse.png");
  scene.load.image("lab", "maps/tilesets/lab.png");
  scene.load.image("skyscraper", "maps/tilesets/skyscraper.png");
  scene.load.image("temple", "maps/tilesets/temple.png");
  scene.load.image("decorations", "maps/tilesets/decorations.png");
  levelData.forEach(({ level }) =>
    scene.load.tilemapTiledJSONExternal(level, `maps-v2/${level}.json`)
  );
}

/**
 * Construct a tile key from a given level and tile obj.
 * @param level
 * @param tile
 */
const getDialogueKey = (level: string, tile: { x: number; y: number }) =>
  `${level}-tile-${tile.x}-${tile.y}`;

/**
 * Keys for dialogue data, attached to each tile.
 */
const dialogueKeys = levelData
  .map(({ level, tiles }) => tiles.map((tile) => getDialogueKey(level, tile)))
  .filter((key) => key.length > 0)
  .flat();

/**
 * Loads the JSON files using the key and path from the `levelData` array.
 * @param scene
 */
function loadDialogue(scene: Phaser.Scene) {
  levelData.forEach(({ level, tiles }) => {
    tiles.forEach((tile) => {
      const key = getDialogueKey(level, tile);
      scene.load.json(key, `dialogue/${key}.json`);
    });
  });
}

export { levelData, levelKeys, loadLevels, dialogueKeys, loadDialogue, getDialogueKey };
