import { autorun } from "mobx";
import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import Level from "../level/level";
import store from "../../store";
import GAME_MODES from "./events";
import AttackAnimation from "../player/attack-animation";
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
        scene.scene.start(SCENE_NAME.GAME_OVER, { didPlayerWin: false });
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
    this.mobProxy.observe(store, "hasCompass", () => {
      if (this.compass) this.compass.destroy();
      if (store.hasCompass) this.compass = new Compass(this.scene, this.player, this.level);
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
      const path = this.level.findPathBetween(this.player.getGridPosition(), tileGridPos);

      if (!path) {
        this.toastManager.setMessage("Tile is too far away to move there.");
        return;
      }

      const isRevealed = tile.isRevealed();
      const shouldMoveToTile = tile.type !== TILE_TYPES.WALL && tile.type !== TILE_TYPES.EXIT;

      this.level.disableAllTiles();
      if (!isRevealed) {
        await tile.flipToFront();
        this.applyTileEffect(tile);
        const { x, y } = this.player.getPosition();
        await tile.playTileEffectAnimation(x, y);

        if (tile.type === TILE_TYPES.EXIT) store.setHasCompass(false);
      } else {
        if (tile.type === TILE_TYPES.EXIT) {
          if (store.level >= 5) {
            this.scene.scene.stop();
            this.scene.scene.start(SCENE_NAME.GAME_OVER, {
              didPlayerWin: true
            });
            return;
          } else {
            await this.movePlayerAlongPath(path);
            this.startNewLevel();
            return;
          }
        } else if (tile.type === TILE_TYPES.SHOP) {
          await this.movePlayerAlongPath(path);
          this.applyTileEffect(tile);
        }
      }

      if (shouldMoveToTile) await this.movePlayerAlongPath(path);
      this.updateEnemyCount();
      this.level.enableAllTiles();

      store.addMove();
    });
  }

  startAttackFlow() {
    this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      const tileGridPos = tile.getGridPosition();
      const inRange = this.level.isTileInPlayerRange(this.player.getGridPosition(), tileGridPos);

      if (!inRange) {
        this.toastManager.setMessage("That tile is too far away to attack.");
        return;
      }

      if (tile.isRevealed()) {
        this.toastManager.setMessage("You can't attack a face up tile.");
        return;
      }

      this.level.disableAllTiles();
      await tile.flipToFront();
      store.removeAttack();
      const { x, y } = tile.getPosition();
      const attackAnim = new AttackAnimation(this.scene, "player-attack", x - 12, y);
      await Promise.all([
        attackAnim.fadeout().then(() => attackAnim.destroy()),
        tile.playTileDestructionAnimation()
      ]);

      if (tile.type !== TILE_TYPES.EXIT && tile.type !== TILE_TYPES.WALL) {
        await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
      }
      this.updateEnemyCount();
      this.level.enableAllTiles();

      store.setGameState(GAME_MODES.MOVE_MODE);
    });
  }

  updateEnemyCount() {
    const pos = this.player.getGridPosition();
    const enemyCount = this.level.countNeighboringEnemies(pos.x, pos.y);
    store.setDangerCount(enemyCount);
  }

  async movePlayerAlongPath(path, duration = 200) {
    const lastPoint = path[path.length - 1];
    const worldPath = path.map(p => this.level.gridXYToWorldXY(p));
    await this.player.movePlayerAlongPath(worldPath, duration);
    this.player.setGridPosition(lastPoint.x, lastPoint.y);
    this.level.highlightTiles(this.player.getGridPosition());
  }

  async movePlayerToTile(gridX, gridY, duration = 200) {
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    await this.player.movePlayerTo(worldX, worldY, duration);
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
      case TILE_TYPES.SHOP:
        store.setShopOpen(true);
        break;
    }
  }

  startNewLevel() {
    store.nextLevel();
    if (this.level) this.level.destroy();
    store.setGameState(GAME_MODES.IDLE_MODE);
    store.setHasCompass(false);
    this.level = new Level(this.scene, `level-${store.level}`);
    const gridPos = this.level.getStartingGridPosition();
    this.movePlayerToTile(gridPos.x, gridPos.y, 0);
    const enemyCount = this.level.countNeighboringEnemies(gridPos.x, gridPos.y);
    store.setDangerCount(enemyCount);
    store.setGameState(GAME_MODES.MOVE_MODE);
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}
