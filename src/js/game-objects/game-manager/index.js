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
import CoinCollectAnimation from "../player/coin-collect-animation";
import Radar from "../hud/radar";
import DebugMenu from "../hud/debug-menu";
import DialogScreen from "../hud/dialogue-screen";

export default class GameManager {
  /**
   * @param {Phaser.Scene} scene
   * @param {Player} player
   * @param {ToastManager} toastManager
   * @memberof GameManager
   */
  constructor(scene, player, toastManager) {
    this.scene = scene;
    this.level = null;
    this.player = player;
    this.toastManager = toastManager;
    this.radar = new Radar(scene, store);
    this.radar.setVisible(false);
    this.debugMenu = new DebugMenu(scene, store);
    this.dialogScreen = new DialogScreen(scene, store);

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
    this.mobProxy.observe(store, "levelIndex", () => this.startLevel());

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.startLevel();
  }

  startMoveFlow() {
    this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, async tile => {
      if (
        this.player.getGridPosition().x === tile.getGridPosition().x &&
        this.player.getGridPosition().y === tile.getGridPosition().y
      ) {
        // Don't go to tile you are already at!
        return;
      }

      const tileGridPos = tile.getGridPosition();
      const isRevealed = tile.isRevealed();
      const shouldMoveToTile = tile.type !== TILE_TYPES.WALL && tile.type !== TILE_TYPES.EXIT;
      const path = this.level.findPathBetween(
        this.player.getGridPosition(),
        tileGridPos,
        !isRevealed
      );

      if (!path) {
        this.toastManager.setMessage("Tile is too far away to move there.");
        return;
      }

      this.level.disableAllTiles();
      if (!isRevealed) {
        await tile.flipToFront();
        this.applyTileEffect(tile);
        const { x, y } = this.player.getPosition();
        await tile.playTileEffectAnimation(x, y);
        if (tile.type === TILE_TYPES.KEY) store.setHasKey(true);
        else if (tile.type === TILE_TYPES.EXIT) store.setHasCompass(false);
      } else {
        if (tile.type === TILE_TYPES.EXIT) {
          if (this.level.isExitLocked() && !store.hasKey) {
            this.toastManager.setMessage("Door is locked - you need a key.");
          } else if (store.levelIndex >= 8) {
            this.scene.scene.stop();
            this.scene.scene.start(SCENE_NAME.GAME_OVER, { didPlayerWin: true });
            return;
          } else {
            await this.movePlayerAlongPath(path);
            store.nextLevel();
            return;
          }
        } else if (tile.type === TILE_TYPES.SHOP) {
          await this.movePlayerAlongPath(path);
          this.applyTileEffect(tile);
        } else if (tile.type === TILE_TYPES.KEY) {
          store.setHasKey(true);
          const { x, y } = this.player.getPosition();
          await tile.playTileEffectAnimation(x, y);
        }
      }

      if (shouldMoveToTile) await this.movePlayerAlongPath(path);
      this.updateEnemyCount();

      if (store.dangerCount === 0) {
        const pos = this.player.getGridPosition();
        this.level.getNeighboringTiles(pos.x, pos.y).map(tile => {
          tile.flipToFront();
        });
      }

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
      const shouldGetCoin = tile.type === TILE_TYPES.ENEMY;
      const { x, y } = tile.getPosition();
      const attackAnim = new AttackAnimation(this.scene, "player-attack", x - 40, y - 10);
      await Promise.all([
        attackAnim.fadeout().then(() => attackAnim.destroy()),
        tile.playTileDestructionAnimation()
      ]);
      if (shouldGetCoin) {
        const coinAnim = new CoinCollectAnimation(this.scene, x - 40, y);
        await coinAnim.play();
        coinAnim.destroy();
        store.addGold();
      }

      if (tile.type !== TILE_TYPES.EXIT && tile.type !== TILE_TYPES.WALL) {
        await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
      }
      this.updateEnemyCount();
      this.level.enableAllTiles();

      if (store.dangerCount === 0) {
        const pos = this.player.getGridPosition();
        this.level.getNeighboringTiles(pos.x, pos.y).map(tile => {
          tile.flipToFront();
        });
      }

      store.setGameState(GAME_MODES.MOVE_MODE);
    });
  }

  updateEnemyCount() {
    const pos = this.player.getGridPosition();
    const enemyCount = this.level.countNeighboringEnemies(pos.x, pos.y);
    store.setDangerCount(enemyCount);
    this.updateRadar();
  }

  async movePlayerAlongPath(path, duration = 200) {
    const lastPoint = path[path.length - 1];
    const worldPath = path.map(p => this.level.gridXYToWorldXY(p));
    await this.player.movePlayerAlongPath(worldPath, duration);
    this.player.setGridPosition(lastPoint.x, lastPoint.y);
    this.level.highlightTiles(this.player.getGridPosition());
    await this.updateRadar();
  }

  async movePlayerToTile(gridX, gridY, moveInstantly = false) {
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    await this.player.movePlayerTo(worldX, worldY, moveInstantly);
    this.player.setGridPosition(gridX, gridY);
    this.level.highlightTiles(this.player.getGridPosition());
    await this.updateRadar();
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

  /**
   * Fade out the player, fade out the previous level, set up the next level, and start things off!
   */
  async startLevel() {
    this.radar.setVisible(false);
    await this.player.fadePlayerOut();

    if (this.level) {
      this.level.disableAllTiles();
      await this.level.fadeLevelOut();
      this.level.destroy();
    }

    store.setGameState(GAME_MODES.IDLE_MODE);
    store.setHasCompass(false);
    store.setHasKey(false);

    this.level = new Level(this.scene, store.level);
    const playerStartGridPos = this.level.getStartingGridPosition();

    const enemyCount = this.level.countNeighboringEnemies(
      playerStartGridPos.x,
      playerStartGridPos.y
    );
    store.setDangerCount(enemyCount);

    this.movePlayerToTile(playerStartGridPos.x, playerStartGridPos.y, 0);

    const worldX = this.level.gridXToWorldX(playerStartGridPos.x);
    const worldY = this.level.gridYToWorldY(playerStartGridPos.y);
    this.player.movePlayerTo(worldX, worldY, 0);
    this.player.setGridPosition(playerStartGridPos.x, playerStartGridPos.y);

    await this.player.fadePlayerIn();

    await this.level.fadeLevelIn();
    this.level.highlightTiles(playerStartGridPos);
    this.radar.setVisible(true);
    this.updateRadar(false);

    store.setGameState(GAME_MODES.MOVE_MODE);
  }

  async updateRadar(shouldAnimateUpdate = true) {
    const { x, y } = this.player.getGridPosition();
    const tiles = this.level.getNeighboringTiles(x, y);
    return this.radar.updateShapeFromTiles(tiles, shouldAnimateUpdate);
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}
