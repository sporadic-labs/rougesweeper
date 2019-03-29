import { autorun } from "mobx";
import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import Level from "../level/level";
import store from "../../store";
import GAME_MODES from "./events";
import PlayerAttackAnimation from "../player/attack-animation";
import MobXProxy from "../../helpers/mobx-proxy";
import { SCENE_NAME } from "../../scenes/index";
import EventProxy from "../../helpers/event-proxy";
import Compass from "../hud/compass";

export default class GameManager {
  /** @param {Phaser.Scene} scene */
  constructor(scene, player, toastManager) {
    this.scene = scene;
    this.level = null;
    this.player = player;
    this.toastManager = toastManager;

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(store, "playerHealth", () => {
      if (store.playerHealth === 0) {
        scene.scene.stop();
        scene.scene.start(SCENE_NAME.GAME_OVER);
      }
    });
    this.mobProxy.observe(store, "gameState", () => {
      switch (store.gameState) {
        case GAME_MODES.IDLE_MODE:
        default:
          // Remove event listeners from the current level
          if (this.level && this.level.events) {
            this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
          }
          break;
        case GAME_MODES.ATTACK_MODE:
          this.startAttackFlow();
          break;
        case GAME_MODES.MOVE_MODE:
          this.startMoveFlow();
          break;
      }
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.startNewLevel();
  }

  startMoveFlow() {
    this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      const tileGridPos = tile.getGridPosition();
      const inRange = this.level.isTileInPlayerRange(this.player.getGridPosition(), tileGridPos);

      if (!inRange) {
        this.toastManager.setMessage("Tile is too far away to move there.");
        return;
      }

      this.level.disableAllTiles();
      if (!tile.isRevealed()) {
        await tile.flipToFront();
        this.applyTileEffect(tile);
        await tile.playTileEffectAnimation();
      }

      if (tile.type === TILE_TYPES.EXIT) {
        store.nextLevel();
        this.startNewLevel();
        return;
      }

      this.movePlayerToTile(tileGridPos.x, tileGridPos.y);

      const enemyCount = this.level.countNeighboringEnemies(tileGridPos.x, tileGridPos.y);
      store.setDangerCount(enemyCount);

      this.level.enableAllTiles();
    });
  }

  startAttackFlow() {
    this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      const tileGridPos = tile.getGridPosition();
      const inRange = this.level.isTileInPlayerRange(this.player.getGridPosition(), tileGridPos);

      if (!inRange) {
        this.toastManager.setMessage("Tile is too far away to attack.");
        return;
      }

      this.level.disableAllTiles();
      if (!tile.isRevealed()) {
        await tile.flipToFront();
        store.removeAttack();
        // Player Attack Animation
        const tilePos = tile.getPosition();
        const attackAnim = new PlayerAttackAnimation(this.scene, tilePos.x - 12, tilePos.y);
        await Promise.all([
          attackAnim.fadeout().then(() => attackAnim.destroy()),
          tile.playTileDestructionAnimation()
        ]);
      }

      if (tile.type === TILE_TYPES.EXIT) {
        store.nextLevel();
        this.startNewLevel();
        return;
      }

      this.movePlayerToTile(tileGridPos.x, tileGridPos.y);

      const enemyCount = this.level.countNeighboringEnemies(tileGridPos.x, tileGridPos.y);
      store.setDangerCount(enemyCount);

      this.level.enableAllTiles();

      store.setGameState(GAME_MODES.MOVE_MODE);
    });
  }

  movePlayerToTile(gridX, gridY) {
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    this.player.setPosition(worldX, worldY - 15);
    this.player.setGridPosition(gridX, gridY);
    this.level.highlightTiles(this.player.getGridPosition());
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
    if (this.compass) this.compass.destroy();
    if (this.level) this.level.destroy();
    store.setGameState(GAME_MODES.IDLE_MODE);
    this.level = new Level(this.scene);
    const gridPos = this.level.getStartingGridPosition();
    this.movePlayerToTile(gridPos.x, gridPos.y);
    const enemyCount = this.level.countNeighboringEnemies(gridPos.x, gridPos.y);
    store.setDangerCount(enemyCount);
    store.setGameState(GAME_MODES.MOVE_MODE);
    this.compass = new Compass(this.scene, this.player, this.level);
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}
