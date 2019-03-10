import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import store from "../../store/index";
import Level from "../level/level";

export default class GameManager {
  constructor(scene, player) {
    this.scene = scene;
    this.level = null;
    this.player = player;

    this.startNewLevel();
  }

  startMoveFlow() {
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      const tileGridPos = tile.getGridPosition();
      if (
        this.level.isTileInPlayerRange(
          this.player.getGridPosition(),
          tileGridPos
        )
      ) {
        this.level.disableAllTiles();
        if (!tile.isRevealed()) {
          await tile.flipToFront();
          await tile.playTileGraphicAnimation();
          this.applyTileEffect(tile);
        }

        if (tile.type === TILE_TYPES.EXIT) {
          this.startNewLevel();
          return;
        }

        this.movePlayerToTile(tileGridPos.x, tileGridPos.y);

        const enemyCount = this.level.countNeighboringEnemies(
          tileGridPos.x,
          tileGridPos.y
        );
        store.setDangerCount(enemyCount);

        this.level.enableAllTiles();
      }
    });
  }

  movePlayerToTile(gridX, gridY) {
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    this.player.setPosition(worldX, worldY - 15);
    this.player.setGridPosition(gridX, gridY);
  }

  applyTileEffect(tile) {
    switch (tile.type) {
      case TILE_TYPES.ENEMY:
        store.removeHealth();
        break;
      case TILE_TYPES.GOLD:
        store.addGold();
        break;
    }
  }

  startNewLevel() {
    if (this.level) this.level.destroy();
    this.level = new Level(this.scene);
    const gridPos = this.level.getStartingGridPosition();
    this.movePlayerToTile(gridPos.x, gridPos.y);
    const enemyCount = this.level.countNeighboringEnemies(gridPos.x, gridPos.y);
    store.setDangerCount(enemyCount);
    this.startMoveFlow();
  }
}
