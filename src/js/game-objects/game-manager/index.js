import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";

export default class GameManager {
  constructor(scene, player, level) {
    this.scene = scene;
    this.level = level;
    this.player = player;

    const worldPos = level.getStartingWorldPosition();
    player.setPosition(worldPos.x, worldPos.y);
    const gridPos = level.getStartingGridPosition();
    player.setGridPosition(gridPos.x, gridPos.y);

    this.startMoveFlow();
  }

  startMoveFlow() {
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, tile => {
      // Check if tile is in range of player
      const tileGridPos = tile.getGridPosition();
      if (
        this.level.isTileInPlayerRange(
          this.player.getGridPosition(),
          tileGridPos
        )
      ) {
        //  disable tile interactivity
        this.level.disableAllTiles();
        //  reveal tile
        tile.flipToFront();
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
        //  move player
        console.log(`Moving to tile ${tile.type.toString()}`);
        const worldY = this.level.gridXToWorldX(tileGridPos.x);
        const worldX = this.level.gridYToWorldY(tileGridPos.y);
        this.player.setPosition(worldY, worldX);
        this.player.setGridPosition(tileGridPos.x, tileGridPos.y);
        //  re-enable tile interactivity
        this.level.enableAllTiles();
      } else {
        console.log("Tile is out of range...");
      }
    });
  }
}
