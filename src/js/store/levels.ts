/** Level and tile data for tilemaps and dialogue info. */
const levelData: Array<{
  level: string;
  title: string;
  subtitle: string;
  tiles: Array<{ x: number; y: number }>;
  isLastLevel?: boolean;
}> = [
  {
    level: "level-00",
    title: "Headquarters",
    subtitle: "Tutorial",
    tiles: [],
  },
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
  { level: "level-04", title: "Laboratory", subtitle: "Level 4", tiles: [] },
  { level: "level-05", title: "Laboratory", subtitle: "Level 5", tiles: [] },
  { level: "level-06", title: "Laboratory", subtitle: "Level 6", tiles: [] },
  { level: "level-07", title: "Warehouse", subtitle: "Level 7", tiles: [] },
  { level: "level-08", title: "Warehouse", subtitle: "Level 8", tiles: [] },
  { level: "level-09", title: "Warehouse", subtitle: "Level 9", tiles: [] },
  { level: "level-10", title: "Skyscraper", subtitle: "Level 10", tiles: [] },
  { level: "level-11", title: "Temple", subtitle: "Level 11", tiles: [] },
  { level: "level-12", title: "Jungle", subtitle: "Level 12", tiles: [], isLastLevel: true },
];

/** Keys for levels loaded into Phaser, used to access tilemap info. */
const levelKeys = levelData.map(({ level }) => level);

/** Loads the JSON files using the key and path from the `levelData` array. */
function loadLevels(scene: Phaser.Scene) {
  scene.load.setPath("resources/maps-v2/"); // Set the path for the maps.

  scene.load.image("all-assets", "tilesets/all-assets.png");
  scene.load.image("hq", "tilesets/hq.png");
  scene.load.image("warehouse", "tilesets/warehouse.png");
  scene.load.image("lab", "tilesets/lab.png");
  scene.load.image("skyscraper", "tilesets/skyscraper.png");
  scene.load.image("temple", "tilesets/temple.png");
  scene.load.image("jungle", "tilesets/jungle.png");
  scene.load.image("decorations", "tilesets/decorations.png");
  levelData.forEach(({ level }) => scene.load.tilemapTiledJSONExternal(level, `${level}.json`));

  scene.load.setPath(); // reset the path
}

export { levelData, levelKeys, loadLevels };
