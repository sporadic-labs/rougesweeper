import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import Level from "../level/level";
import store from "../../store";
import GAME_MODES from "./game-modes";
import { makeGameEmitter, GAME_EVENTS } from "./events";
import AttackAnimation from "../player/attack-animation";
import MobXProxy from "../../helpers/mobx-proxy";
import { SCENE_NAME } from "../../scenes/index";
import EventProxy from "../../helpers/event-proxy";
import CoinCollectAnimation from "../player/coin-collect-animation";
import Radar from "../hud/radar";
import DebugMenu from "../hud/debug-menu";
import PauseMenu from "../hud/pause-menu";
import InventoryMenu, { INVENTORY_EVENTS } from "../hud/inventory";
import DialogueManager from "../hud/dialogue-manager";
import Player from "../player";
import ToastManager from "../hud/toast-manager";
import Tile from "../level/tile";
import Door from "../level/door";
import Compass from "../hud/compass";
import { Point } from "../../helpers/common-interfaces";
import { INVENTORY_ITEMS } from "../hud/inventory-toggle";
import TutorialLogic from "../level/tutorial-logic";
import EventEmitter from "../../helpers/event-emitter";

export default class GameManager {
  private level: Level;
  private radar: Radar;
  private debugMenu: DebugMenu;
  private pauseMenu: PauseMenu;
  private inventoryMenu: InventoryMenu;
  private dialogueManager: DialogueManager;
  private compass: Compass;
  private mobProxy: MobXProxy;
  private proxy: EventProxy;
  private tutorialLogic: TutorialLogic;
  public events = makeGameEmitter();

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private toastManager: ToastManager
  ) {
    this.level = null;
    this.radar = new Radar(scene, player);
    this.radar.setVisible(false);
    this.debugMenu = new DebugMenu(scene, store);
    this.pauseMenu = new PauseMenu(scene, store);
    this.inventoryMenu = new InventoryMenu(scene, store);
    this.dialogueManager = new DialogueManager(scene, store);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(store, "playerHealth", () => {
      if (store.playerHealth === 0) {
        scene.scene.stop();
        scene.scene.start(SCENE_NAME.GAME_OVER, { didPlayerWin: false });
      }
    });
    this.mobProxy.observe(store, "gameState", () => {
      if (store.gameState === GAME_MODES.MENU_MODE && this.level && this.level.events)
        this.disableInteractivity();
      else if (this.level && this.level.events) this.enableInteractivity();
    });
    this.mobProxy.observe(store, "levelIndex", () => this.startLevel());

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.startLevel();
  }

  /**
   * Start the idle flow for the player, waiting for the user to make a move!
   */
  startIdleFlow() {
    this.enableInteractivity();
  }

  enableInteractivity() {
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT_PRIMARY, this.onTileSelectPrimary);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT_SECONDARY, this.onTileSelectSecondary);
    this.level.events.on(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitSelect);

    this.inventoryMenu.events.on(INVENTORY_EVENTS.SELECT, this.onInventorySelect);
    this.inventoryMenu.events.on(INVENTORY_EVENTS.DESELECT, this.onInventoryDeselect);
  }

  disableInteractivity() {
    this.level.events.off(LEVEL_EVENTS.TILE_SELECT_PRIMARY, this.onTileSelectPrimary);
    this.level.events.off(LEVEL_EVENTS.TILE_SELECT_SECONDARY, this.onTileSelectSecondary);
    this.level.events.off(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitSelect);

    this.inventoryMenu.events.off(INVENTORY_EVENTS.SELECT, this.onInventorySelect);
    this.inventoryMenu.events.off(INVENTORY_EVENTS.DESELECT, this.onInventoryDeselect);
  }

  onInventorySelect = async (type: INVENTORY_ITEMS) => {
    this.disableInteractivity();
    store.setGameState(GAME_MODES.SKILL_MODE);

    switch (type) {
      case INVENTORY_ITEMS.COMPASS: {
        if (this.compass) {
          this.toastManager.setMessage("A compass is already active.");
          this.inventoryMenu.deselectAll();
        } else {
          this.compass = new Compass(this.scene, this.player, this.level);
          store.setHasCompass(false);
        }
        this.disableInteractivity();
        store.setGameState(GAME_MODES.IDLE_MODE);
        break;
      }
      case INVENTORY_ITEMS.REVEAL_IN_RADAR: {
        const success = await this.clearTilesInRadar();
        if (success) {
          store.setHasClearRadar(false);
        } else {
          this.toastManager.setMessage("No tiles can be revealed.");
          this.inventoryMenu.deselectAll();
        }
        this.disableInteractivity();
        store.setGameState(GAME_MODES.IDLE_MODE);
        break;
      }
      case INVENTORY_ITEMS.REVEAL_TILE: {
        // NOTE(rex): This is handled by onTileSelectPrimary.
        break;
      }
    }
  };

  onInventoryDeselect = async (type: INVENTORY_ITEMS) => {
    this.disableInteractivity();
    store.setGameState(GAME_MODES.IDLE_MODE);
  };

  onExitSelect = async (door: Door) => {
    const playerGridPos = this.player.getGridPosition();
    const exitGridPos = this.level.exitGridPosition;

    if (door === this.level.entrance) {
      this.toastManager.setMessage("The entrance is locked. You can't go back.");
      return;
    }

    const path = this.level.findPathBetween(playerGridPos, exitGridPos, true);

    if (!path) {
      this.toastManager.setMessage("There is no clear path to the door - get closer.");
      return;
    }

    this.disableInteractivity();
    store.addMove();

    await this.movePlayerAlongPath(path);
    this.level.events.emit(LEVEL_EVENTS.PLAYER_FINISHED_MOVE, this.player);
    this.events.emit(GAME_EVENTS.EXIT_SELECT, door);

    if (this.level.exit.isOpen()) {
      const { x, y } = this.level.gridXYToWorldXY(exitGridPos);
      const coinAnim = new CoinCollectAnimation(this.scene, x - 40, y);
      await coinAnim.play();
      coinAnim.destroy();
      store.addGold();
      store.nextLevel();
      return;
    } else {
      this.toastManager.setMessage("That door is locked - find the key.");
    }

    this.enableInteractivity();
  };

  onTileSelectPrimary = async (tile: Tile) => {
    if (store.gameState === GAME_MODES.SKILL_MODE) {
      this.onTileSelectForReveal(tile);
    } else {
      this.onTileSelectForMove(tile);
    }
  };

  onTileSelectSecondary = async (tile: Tile) => {
    if (store.gameState === GAME_MODES.SKILL_MODE) {
      store.setGameState(GAME_MODES.IDLE_MODE);
      this.inventoryMenu.deselectAll();
    } else {
      this.onTileSelectForAttack(tile);
    }
  };

  onTileSelectForAttack = async (tile: Tile) => {
    if (store.gameState === GAME_MODES.SKILL_MODE) return;

    const playerGridPos = this.player.getGridPosition();
    const tileGridPos = tile.getGridPosition();

    // Don't interact with the current tile on which player is standing.
    if (playerGridPos.x === tileGridPos.x && playerGridPos.y === tileGridPos.y) {
      return;
    }

    const path = this.level.findPathBetween(playerGridPos, tileGridPos, true);
    const canAttack = path && !tile.isRevealed;
    if (!canAttack) {
      this.toastManager.setMessage("You can't hack that location.");
      return;
    }

    if (store.playerAmmo === 0) {
      this.toastManager.setMessage("Not enough ammo to hack anything!");
      return;
    }

    this.disableInteractivity();
    await this.runAttackFlow(tile, path);
  };

  onTileSelectForMove = async (tile: Tile) => {
    const playerGridPos = this.player.getGridPosition();
    const tileGridPos = tile.getGridPosition();

    // Don't interact with the current tile on which player is standing.
    if (playerGridPos.x === tileGridPos.x && playerGridPos.y === tileGridPos.y) {
      return;
    }

    const path = this.level.findPathBetween(playerGridPos, tileGridPos, true);
    const isValidMove = path && (!tile.isRevealed || tile.type !== TILE_TYPES.WALL);
    if (!isValidMove) {
      this.toastManager.setMessage("You can't move there.");
      return;
    }

    this.disableInteractivity();
    await this.runMoveFlow(tile, path);
  };

  onTileSelectForReveal = async (tile: Tile) => {
    const playerGridPos = this.player.getGridPosition();
    const tileGridPos = tile.getGridPosition();

    // Don't interact with the current tile on which player is standing.
    if (playerGridPos.x === tileGridPos.x && playerGridPos.y === tileGridPos.y) {
      return;
    }

    const canRevealDistantTile = store.hasRevealTile && !tile.isRevealed;

    if (!canRevealDistantTile) {
      this.toastManager.setMessage("You can't reveal that tile.");
      return;
    }

    this.disableInteractivity();
    this.level.disableAllTiles();

    await tile.flipToFront();
    const shouldGetCoin = tile.type === TILE_TYPES.ENEMY || tile.type === TILE_TYPES.SCRAMBLE_ENEMY;
    if (shouldGetCoin) {
      const { x, y } = tile.getPosition();
      const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(1, 3)}`;
      const attackAnim = new AttackAnimation(this.scene, attackAnimKey, x - 40, y - 10);
      await Promise.all([
        attackAnim.fadeout().then(() => attackAnim.destroy()),
        tile.playTileDestructionAnimation(),
      ]);
      const coinAnim = new CoinCollectAnimation(this.scene, x - 40, y);
      await coinAnim.play();
      coinAnim.destroy();
      store.addGold();
    }

    store.setHasRevealTile(false);

    await this.radar.update();
    this.flipTilesIfClear();

    this.level.enableAllTiles();
    store.setGameState(GAME_MODES.IDLE_MODE);
    return;
  };

  async clearTilesInRadar() {
    const playerPos = this.player.getGridPosition();
    const tiles = this.level.getNeighboringTiles(playerPos.x, playerPos.y);

    if (tiles.map((tile) => !tile.isRevealed).filter((revealed) => revealed).length === 0) {
      return Promise.resolve(false);
    }

    return tiles.map(async (tile) => {
      await tile.flipToFront();
      const shouldGetCoin =
        tile.type === TILE_TYPES.ENEMY || tile.type === TILE_TYPES.SCRAMBLE_ENEMY;
      if (shouldGetCoin) {
        const { x, y } = tile.getPosition();
        const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(1, 3)}`;
        const attackAnim = new AttackAnimation(this.scene, attackAnimKey, x - 40, y - 10);
        await Promise.all([
          attackAnim.fadeout().then(() => attackAnim.destroy()),
          tile.playTileDestructionAnimation(),
        ]);
        const coinAnim = new CoinCollectAnimation(this.scene, x - 40, y);
        await coinAnim.play();
        coinAnim.destroy();
        store.addGold();
      }
      return Promise.resolve(true);
    });
  }

  async runMoveFlow(tile: Tile, path: Point[]) {
    // disable tiles, start the move
    this.level.disableAllTiles();
    store.addMove();

    /* if the tile has been revealed/is blank, move there immediately,
     * otherwise move to the tile right before this one.
     */
    if (tile.isRevealed && tile.isCurrentlyBlank) await this.movePlayerAlongPath(path);
    else if (path.length > 2) await this.movePlayerAlongPath(path.slice(0, path.length - 1));

    // if the tile has not been revealed, reveal it
    if (!tile.isRevealed) await tile.flipToFront();

    if (!tile.isCurrentlyBlank) {
      // Apply any effect that need to be immediate.
      switch (tile.type) {
        case TILE_TYPES.ENEMY:
        case TILE_TYPES.SCRAMBLE_ENEMY:
          store.removeHealth();
          break;
        case TILE_TYPES.GOLD:
          store.addGold();
          break;
      }
      const { x, y } = this.player.getPosition();
      await tile.playTileEffectAnimation(x, y);
    }

    // if you can move to the tile, move
    const shouldMoveToTile = tile.type !== TILE_TYPES.WALL;
    const tileGridPos = tile.getGridPosition();
    if (shouldMoveToTile) {
      await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
    }

    this.level.events.emit(LEVEL_EVENTS.PLAYER_FINISHED_MOVE, this.player);

    // if there is dialogue, play it
    const playerGridPos = this.player.getGridPosition();
    const currentTile = this.level.getTileFromGrid(playerGridPos.x, playerGridPos.y);

    await this.radar.update();
    this.flipTilesIfClear();

    // if the tile is the EXIT, check if the player has the correct conditions to finish the level
    if (currentTile.type === TILE_TYPES.EXIT) {
      if (!this.level.exit.isOpen()) {
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

    // re-enable tiles, and kick off the idle flow to wait for another move.
    this.level.enableAllTiles();
    this.startIdleFlow();

    // Disabled in favor of using the tutorial class:
    // this.dialogueManager.playDialogueFromTile(currentTile);

    // Apply any effect that need to happen at the end of moving.
    switch (tile.type) {
      case TILE_TYPES.SHOP:
        store.setShopUnlockOpen(true);
        break;
      case TILE_TYPES.KEY:
        store.setHasKey(true);
        this.level.exit.open();
        this.level.exit.flipTileToFront();
        break;
    }
  }

  /**
   * Start the attack flow for the player.
   * @param {*} tile
   * @param {*} path
   */
  async runAttackFlow(tile: Tile, path: Point[]) {
    this.level.disableAllTiles();

    if (path.length > 2) await this.movePlayerAlongPath(path.slice(0, path.length - 1));
    await tile.flipToFront();
    store.removeAmmo();
    const shouldGetCoin = tile.type === TILE_TYPES.ENEMY || tile.type === TILE_TYPES.SCRAMBLE_ENEMY;
    const { x, y } = tile.getPosition();
    const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(1, 3)}`;
    const attackAnim = new AttackAnimation(this.scene, attackAnimKey, x - 40, y - 10);
    await Promise.all([
      attackAnim.fadeout().then(() => attackAnim.destroy()),
      tile.playTileDestructionAnimation(),
    ]);
    if (shouldGetCoin) {
      const coinAnim = new CoinCollectAnimation(this.scene, x - 40, y);
      await coinAnim.play();
      coinAnim.destroy();
      store.addGold();
    }

    if (tile.type !== TILE_TYPES.EXIT && tile.type !== TILE_TYPES.WALL) {
      const tileGridPos = tile.getGridPosition();
      await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
    }

    await this.radar.update();
    this.flipTilesIfClear();

    this.level.enableAllTiles();
    this.startIdleFlow();
  }

  private flipTilesIfClear() {
    const playerGridPos = this.player.getGridPosition();
    const enemyCount = this.level.countNeighboringEnemies(playerGridPos.x, playerGridPos.y);
    const isTileScrambled = this.level.isTileScrambled(playerGridPos.x, playerGridPos.y);
    if (enemyCount === 0 && !isTileScrambled) {
      this.level
        .getNeighboringTiles(playerGridPos.x, playerGridPos.y)
        .forEach((tile) => tile.flipToFront());
    }
  }

  /**
   * Move the player along a path of tiles.
   * @param {*} path
   * @param {*} duration
   */
  async movePlayerAlongPath(path: Point[], duration = 200) {
    this.radar.closeRadar();
    const lastPoint = path[path.length - 1];
    const worldPath = path.map((p) => this.level.gridXYToWorldXY(p));
    this.level.unhighlightTiles(this.player.getPosition());
    await this.player.movePlayerAlongPath(worldPath);
    this.player.setGridPosition(lastPoint.x, lastPoint.y);
    this.level.highlightTiles(this.player.getGridPosition());
  }

  /**
   * Move the player to the specified tile.
   * @param {*} gridX
   * @param {*} gridY
   * @param {*} moveInstantly
   */
  async movePlayerToTile(gridX: number, gridY: number, moveInstantly = false) {
    this.radar.closeRadar();
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    this.level.unhighlightTiles(this.player.getPosition());
    await this.player.movePlayerTo(worldX, worldY, moveInstantly);
    this.player.setGridPosition(gridX, gridY);
    this.level.highlightTiles(this.player.getGridPosition());
  }

  /**
   * Fade out the player, fade out the previous level, set up the next level, and start things off!
   */
  async startLevel() {
    if (this.dialogueManager.isOpen()) this.dialogueManager.close();
    this.radar.setVisible(false);
    if (this.compass) {
      this.compass.destroy();
      this.compass = null;
    }
    await this.player.fadePlayerOut();

    if (this.level) {
      this.disableInteractivity();
      this.level.disableAllTiles();
      await this.level.fadeLevelOut();
      this.level.destroy();
    }

    store.setGameState(GAME_MODES.IDLE_MODE);
    store.setHasKey(false);

    this.level = new Level(this.scene, store.level, this.dialogueManager);
    const playerStartGridPos = this.level.getStartingGridPosition();

    if (this.tutorialLogic) {
      this.tutorialLogic.destroy();
    }
    this.tutorialLogic = new TutorialLogic(
      this.scene,
      this.dialogueManager,
      this.level,
      store.level,
      this.events
    );

    const enemyCount = this.level.countNeighboringEnemies(
      playerStartGridPos.x,
      playerStartGridPos.y
    );
    store.setDangerCount(enemyCount);

    await this.level.fadeLevelIn();

    const entranceWorldPos = this.level.entranceWorldPosition;
    this.player.setPosition(entranceWorldPos.x, entranceWorldPos.y);
    await this.player.fadePlayerIn();
    await this.movePlayerToTile(playerStartGridPos.x, playerStartGridPos.y, false);
    await this.level.entrance.close();

    this.radar.setLevel(this.level);
    this.radar.setVisible(true);
    this.radar.update();

    this.events.emit(GAME_EVENTS.LEVEL_START, this.level);

    this.startIdleFlow();
  }

  destroy() {
    this.events.destroy();
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}
