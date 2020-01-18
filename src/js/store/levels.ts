/**
 * Level and tile data for tilemaps and dialogue info.
 */
const levelData = [
  { level: "level-1-floor-1", title: "Headquarters", subtitle: "Floor 1", tiles: [{ x: 2, y: 2 }] },
  { level: "level-1-floor-2", title: "Headquarters", subtitle: "Floor 2", tiles: [{ x: 1, y: 2 }] },
  { level: "level-1-floor-3", title: "Headquarters", subtitle: "Floor 3", tiles: [{ x: 2, y: 3 }] },
  { level: "level-2-floor-1", title: "Warehouse", subtitle: "Floor 1", tiles: [] },
  { level: "level-2-floor-2", title: "Warehouse", subtitle: "Floor 2", tiles: [] },
  { level: "level-2-floor-3", title: "Warehouse", subtitle: "Floor 3", tiles: [] },
  { level: "level-2-floor-4", title: "Warehouse", subtitle: "Floor 4", tiles: [] },
  { level: "level-3-floor-1", title: "Laboratory", subtitle: "Floor 1", tiles: [] },
  { level: "level-3-floor-2", title: "Laboratory", subtitle: "Floor 2", tiles: [] },
  { level: "level-3-floor-3", title: "Laboratory", subtitle: "Floor 3", tiles: [] },
  { level: "level-4-floor-1", title: "Skyscraper", subtitle: "Floor 1", tiles: [] },
  { level: "level-4-floor-2", title: "Skyscraper", subtitle: "Floor 2", tiles: [] },
  { level: "level-4-floor-3", title: "Skyscraper", subtitle: "Floor 3", tiles: [] }
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
  levelData.forEach(({ level }) =>
    scene.load.tilemapTiledJSONExternal(level, `maps/${level}.json`)
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
  .map(({ level, tiles }) => tiles.map(tile => getDialogueKey(level, tile)))
  .filter(key => key.length > 0)
  .flat();

/**
 * Loads the JSON files using the key and path from the `levelData` array.
 * @param scene
 */
function loadDialogue(scene: Phaser.Scene) {
  levelData.forEach(({ level, tiles }) => {
    tiles.forEach(tile => {
      const key = getDialogueKey(level, tile);
      scene.load.json(key, `dialogue/${key}.json`);
    });
  });
}

export { levelData, levelKeys, loadLevels, dialogueKeys, loadDialogue, getDialogueKey };
