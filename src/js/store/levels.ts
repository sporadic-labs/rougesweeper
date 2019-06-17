const levelInfo = [
  { key: "level-1-floor-1", path: "maps/new-story/level-1-floor-1.json" },
  { key: "level-1-floor-2", path: "maps/new-story/level-1-floor-2.json" },
  { key: "level-1-floor-3", path: "maps/new-story/level-1-floor-3.json" },
  { key: "level-2-floor-1", path: "maps/new-story/level-2-floor-1.json" },
  { key: "level-2-floor-2", path: "maps/new-story/level-2-floor-2.json" },
  { key: "level-2-floor-3", path: "maps/new-story/level-2-floor-3.json" },
  { key: "level-2-floor-4", path: "maps/new-story/level-2-floor-4.json" },
  { key: "level-3-floor-1", path: "maps/new-story/level-3-floor-1.json" }
];

const levelKeys = levelInfo.map(({ key }) => key);

/**
 * Loads the JSON files using the key and path from the `levelInfo` array.
 */
function loadLevels(scene: Phaser.Scene) {
  levelInfo.forEach(({ key, path }) => scene.load.tilemapTiledJSON(key, path));
}

export { levelKeys, loadLevels };
