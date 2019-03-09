import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import store from "../../store/index";

export default class GameManager {
  constructor(scene, player, level) {
    this.scene = scene;
    this.level = level;
    this.player = player;

    const gridPos = level.getStartingGridPosition();
    this.movePlayerToTile(gridPos.x, gridPos.y);
    const enemyCount = this.level.countNeighboringEnemies(gridPos.x, gridPos.y);
    store.setDangerCount(enemyCount);

    this.startMoveFlow();
  }

  startMoveFlow() {
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      const tileGridPos = tile.getGridPosition();
      if (this.level.isTileInPlayerRange(this.player.getGridPosition(), tileGridPos)) {
        this.level.disableAllTiles();
        if (!tile.isRevealed()) await tile.flipToFront();
        //  apply tile effect
        switch (tile.type) {
          case TILE_TYPES.ENEMY:
            this.player.removeHealth();
            break;
          case TILE_TYPES.EXIT:
            console.log("Get outta here!");
            // TODO(rex): New level;
            break;
          case TILE_TYPES.GOLD:
            this.player.addGold();
            break;
          case TILE_TYPES.BLANK:
          default:
            break;
        }

        this.movePlayerToTile(tileGridPos.x, tileGridPos.y);

        const enemyCount = this.level.countNeighboringEnemies(tileGridPos.x, tileGridPos.y);
        store.setDangerCount(enemyCount);

        this.level.enableAllTiles();
      } else {
        console.log("Tile is out of range...");
      }
    });
  }

  movePlayerToTile(gridX, gridY) {
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    this.player.setPosition(worldX, worldY - 15);
    this.player.setGridPosition(gridX, gridY);
  }
}
