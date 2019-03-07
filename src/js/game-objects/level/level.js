import TILE_TYPES from "./tile-types";
import Tile from "./tile";
import LevelData from "./level-data";

export default class Level {
  constructor(scene) {
    this.scene = scene;

    const composition = {
      [TILE_TYPES.ENEMY]: 5,
      [TILE_TYPES.GOLD]: 5
    };
    this.data = new LevelData(7, 7, composition, { x: 0, y: 0 }, { x: 6, y: 6 });
    this.data.debugDump();

    this.tiles = this.data.tiles.map((row, y) =>
      row.map((type, x) => {
        const tile = new Tile(scene, type, this.gridXToWorldX(x), this.gridYToWorldY(y));
        if (type === TILE_TYPES.EXIT) tile.flipToFront();
        return tile;
      })
    );
  }

  getStartingPosition() {
    const pos = this.data.playerPosition;
    return { x: this.gridXToWorldX(pos.x), y: this.gridYToWorldY(pos.y) };
  }

  gridXToWorldX(x) {
    return 50 + x * 80;
  }

  gridYToWorldY(y) {
    return 50 + y * 80;
  }
}
