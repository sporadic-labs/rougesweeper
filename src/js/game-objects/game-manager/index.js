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
import DialogueManager from "../hud/dialogue-manager";
import RadialMenu, { RadialOption, MenuEvents } from "../hud/radial-menu";

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
    this.dialogueManager = new DialogueManager(scene, store);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(store, "playerHealth", () => {
      if (store.playerHealth === 0) {
        scene.scene.stop();
        scene.scene.start(SCENE_NAME.GAME_OVER, { didPlayerWin: false });
      }
    });
    this.mobProxy.observe(store, "gameState", () => {
      console.log(store.gameState);
      switch (store.gameState) {
        case GAME_MODES.MENU_MODE:
        default:
          // Remove event listeners from the current level
          if (this.level && this.level.events) {
            this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
          }
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

  startIdleFlow() {
    this.level.events.removeAllListeners(LEVEL_EVENTS.TILE_SELECT);
    this.level.events.on(LEVEL_EVENTS.TILE_OVER, tile => {
      const playerGridPos = this.player.getGridPosition();
      const tileGridPos = tile.getGridPosition();
      const tileWorldPos = tile.getPosition();

      if (this.menu) {
        if (this.menu.x === tileWorldPos.x && this.menu.y === tileWorldPos.y) return;
        this.menu.destroy();
        this.menu = null;
      }

      // Don't interact with the current tile on which player is standing.
      if (playerGridPos.x === tileGridPos.x && playerGridPos.y === tileGridPos.y) return;

      const path = this.level.findPathBetween(playerGridPos, tileGridPos, true);

      this.menu = new RadialMenu(this.scene, tileWorldPos.x, tileWorldPos.y);
      const options = [RadialOption.CLOSE];
      if (path) {
        if (!tile.isRevealed) options.push(RadialOption.HACK);
        if (!tile.isRevealed || tile.type !== TILE_TYPES.WALL) options.push(RadialOption.MOVE);
      }
      this.menu.setEnabledOptions(options);
      this.menu.open();
      this.menu.events.on(MenuEvents.VALID_OPTION_SELECT, async type => {
        this.menu.close();
        if (type === RadialOption.MOVE) {
          await this.runMoveFlow(tile, path);
        } else if (type === RadialOption.HACK) {
          await this.runAttackFlow(tile, path);
        }
        this.startIdleFlow();
      });
      this.menu.events.on(MenuEvents.INVALID_OPTION_SELECT, type => {
        let message;
        if (type === RadialOption.MOVE) message = "You can't move there.";
        else if (type === RadialOption.HACK) message = "You can't attack that tile.";
        this.toastManager.setMessage(message);
      });
      this.menu.events.on(MenuEvents.MENU_CLOSE, () => this.menu.close());
    });
  }

  async runMoveFlow(tile, path) {
    this.level.disableAllTiles();
    store.addMove();

    if (tile.isRevealed) {
      await this.movePlayerAlongPath(path);
    } else {
      if (path.length > 2) await this.movePlayerAlongPath(path.slice(0, path.length - 1));

      await tile.flipToFront();
      this.applyTileEffect(tile);
      const { x, y } = this.player.getPosition();
      await tile.playTileEffectAnimation(x, y);

      // Don't move to a freshly revealed wall or exit.
      const shouldMoveToTile = tile.type !== TILE_TYPES.WALL && tile.type !== TILE_TYPES.EXIT;
      if (shouldMoveToTile) {
        const tileGridPos = tile.getGridPosition();
        await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
      }
    }

    const playerGridPos = this.player.getGridPosition();
    const currentTile = this.level.getTileFromGrid(playerGridPos.x, playerGridPos.y);
    this.updateEnemyCount();
    this.dialogueManager.playDialogueFromTile(currentTile);

    if (currentTile.type === TILE_TYPES.KEY) {
      store.setHasKey(true);
    } else if (currentTile.type === TILE_TYPES.EXIT) {
      if (this.level.isExitLocked() && !store.hasKey) {
        this.toastManager.setMessage("Door is locked - you need a key.");
      } else if (store.levelIndex >= 8) {
        this.scene.scene.stop();
        this.scene.scene.start(SCENE_NAME.GAME_OVER, { didPlayerWin: true });
        return;
      } else {
        store.nextLevel();
        return;
      }
    }

    this.level.enableAllTiles();
    this.startIdleFlow();
  }

  async runAttackFlow(tile, path) {
    this.level.disableAllTiles();

    if (path.length > 2) await this.movePlayerAlongPath(path.slice(0, path.length - 1));
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
    this.startIdleFlow();
  }

  updateEnemyCount() {
    const pos = this.player.getGridPosition();
    const enemyCount = this.level.countNeighboringEnemies(pos.x, pos.y);
    store.setDangerCount(enemyCount);
    if (enemyCount === 0) {
      this.level.getNeighboringTiles(pos.x, pos.y).map(tile => tile.flipToFront());
    }
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

    this.level = new Level(this.scene, store.level, this.dialogueManager);
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

    this.startIdleFlow();
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
