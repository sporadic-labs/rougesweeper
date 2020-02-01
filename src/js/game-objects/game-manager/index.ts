import LEVEL_EVENTS from "../level/events";
import TILE_TYPES from "../level/tile-types";
import Level from "../level/level";
import store from "../../store";
import GAME_MODES from "./events";
import AttackAnimation from "../player/attack-animation";
import MobXProxy from "../../helpers/mobx-proxy";
import { SCENE_NAME } from "../../scenes/index";
import EventProxy from "../../helpers/event-proxy";
import CoinCollectAnimation from "../player/coin-collect-animation";
import Radar from "../hud/radar";
import DebugMenu from "../hud/debug-menu";
import InventoryMenu from "../hud/inventory";
import DialogueManager from "../hud/dialogue-manager";
import Player from "../player";
import ToastManager from "../hud/toast-manager";
import Tile from "../level/tile";

interface Point {
  x: number;
  y: number;
}

export default class GameManager {
  private level: Level;
  private radar: Radar;
  private debugMenu: DebugMenu;
  private inventoryMenu: InventoryMenu;
  private dialogueManager: DialogueManager;
  private mobProxy: MobXProxy;
  private proxy: EventProxy;

  constructor(
    private scene: Phaser.Scene,
    private player: Player,
    private toastManager: ToastManager
  ) {
    this.level = null;
    this.radar = new Radar(scene, player);
    this.radar.setVisible(false);
    this.debugMenu = new DebugMenu(scene, store);
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
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT_PRIMARY, this.onTileSelectForMove);
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT_SECONDARY, this.onTileSelectForAttack);
    this.level.events.on(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitSelect);
  }

  disableInteractivity() {
    this.level.events.off(LEVEL_EVENTS.TILE_SELECT_PRIMARY, this.onTileSelectForMove);
    this.level.events.off(LEVEL_EVENTS.TILE_SELECT_SECONDARY, this.onTileSelectForAttack);
    this.level.events.off(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitSelect);
  }

  onExitSelect = async () => {
    const playerGridPos = this.player.getGridPosition();
    const exitGridPos = this.level.exitGridPosition;
    const exitNeighborTiles: Tile[] = this.level.getNeighboringTiles(exitGridPos.x, exitGridPos.y);

    const revealedTiles = exitNeighborTiles.filter(tile => tile.isRevealed);
    if (revealedTiles.length === 0) {
      this.toastManager.setMessage("There is no clear path to the door - get closer.");
      return;
    }

    // Find the shortest path to the exit, using the fact that diagonal moves have a distance of
    // ~1.4 compared to a distance of 1 for horizontal/vertical moves.
    let shortestPath: Point[] = null;
    let shortestDistance = Number.MAX_VALUE;
    for (const tile of revealedTiles) {
      const tileGridPos = tile.getGridPosition();
      const path: Point[] = this.level.findPathBetween(playerGridPos, tileGridPos, true);
      if (!path) continue;
      let distance = 0;
      for (let i = 0; i < path.length - 1; i++) {
        distance += Phaser.Math.Distance.BetweenPoints(path[i], path[i + 1]);
      }
      if (!shortestPath || distance < shortestDistance) {
        shortestPath = path;
        shortestDistance = distance;
      }
    }

    if (!shortestPath) {
      this.toastManager.setMessage("There is no clear path to the door - get closer.");
      return;
    }

    if (!this.level.exit.isOpen()) {
      this.toastManager.setMessage("The door is locked");
      return;
    }

    this.disableInteractivity();
    store.addMove();

    // TODO: open door and move through it.
    if (shortestPath.length > 0) await this.movePlayerAlongPath(shortestPath);
    store.nextLevel();
  };

  onTileSelectForAttack = async (tile: Tile) => {
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

    // if the tile effect has not been applied, apply it
    if (!tile.isCurrentlyBlank) {
      const { x, y } = this.player.getPosition();
      await tile.playTileEffectAnimation(x, y);
    }

    // if you can move to the tile, move
    const shouldMoveToTile = tile.type !== TILE_TYPES.WALL;
    if (shouldMoveToTile) {
      const tileGridPos = tile.getGridPosition();
      await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
    }

    // if there is dialogue, play it
    const playerGridPos = this.player.getGridPosition();
    const currentTile = this.level.getTileFromGrid(playerGridPos.x, playerGridPos.y);

    // update the radar
    await this.radar.update();
    if (this.radar.getEnemyCount() === 0) {
      this.level
        .getNeighboringTiles(playerGridPos.x, playerGridPos.y)
        .map(tile => tile.flipToFront());
    }

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

    // NOTE(rex): Apply tile effects at the end, in case there are menus that open which disable interactivity.
    this.dialogueManager.playDialogueFromTile(currentTile);
    this.applyTileEffect(tile);
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
    store.removeAttack();
    const shouldGetCoin = tile.type === TILE_TYPES.ENEMY;
    const { x, y } = tile.getPosition();
    const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(1, 3)}`;
    const attackAnim = new AttackAnimation(this.scene, attackAnimKey, x - 40, y - 10);
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
      const tileGridPos = tile.getGridPosition();
      await this.movePlayerToTile(tileGridPos.x, tileGridPos.y);
    }

    const playerGridPos = this.player.getGridPosition();
    await this.radar.update();
    if (this.radar.getEnemyCount() === 0) {
      this.level
        .getNeighboringTiles(playerGridPos.x, playerGridPos.y)
        .map(tile => tile.flipToFront());
    }

    this.level.enableAllTiles();
    this.startIdleFlow();
  }

  /**
   * Move the player along a path of tiles.
   * @param {*} path
   * @param {*} duration
   */
  async movePlayerAlongPath(path: Point[], duration: number = 200) {
    const lastPoint = path[path.length - 1];
    const worldPath = path.map(p => this.level.gridXYToWorldXY(p));
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
    const worldX = this.level.gridXToWorldX(gridX);
    const worldY = this.level.gridYToWorldY(gridY);
    await this.player.movePlayerTo(worldX, worldY, moveInstantly);
    this.player.setGridPosition(gridX, gridY);
    this.level.highlightTiles(this.player.getGridPosition());
  }

  /**
   * Update the store based on the Tile type
   * @param {*} tile
   */
  applyTileEffect(tile: Tile) {
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
      case TILE_TYPES.KEY:
        store.setHasKey(true);
        this.level.exit.open();
        break;
    }
  }

  /**
   * Fade out the player, fade out the previous level, set up the next level, and start things off!
   */
  async startLevel() {
    if (this.dialogueManager.isOpen()) this.dialogueManager.close();
    this.radar.setVisible(false);
    await this.player.fadePlayerOut();

    if (this.level) {
      this.level.disableAllTiles();
      await this.level.fadeLevelOut();
      this.level.destroy();
    }

    store.setGameState(GAME_MODES.IDLE_MODE);
    store.setHasKey(false);

    this.level = new Level(this.scene, store.level, this.dialogueManager);
    const playerStartGridPos = this.level.getStartingGridPosition();

    const enemyCount = this.level.countNeighboringEnemies(
      playerStartGridPos.x,
      playerStartGridPos.y
    );
    store.setDangerCount(enemyCount);

    this.movePlayerToTile(playerStartGridPos.x, playerStartGridPos.y, true);

    const worldX = this.level.gridXToWorldX(playerStartGridPos.x);
    const worldY = this.level.gridYToWorldY(playerStartGridPos.y);
    this.player.movePlayerTo(worldX, worldY, true);
    this.player.setGridPosition(playerStartGridPos.x, playerStartGridPos.y);

    await this.player.fadePlayerIn();

    await this.level.fadeLevelIn();
    this.level.highlightTiles(playerStartGridPos);

    this.radar.setLevel(this.level);
    this.radar.setVisible(true);
    this.radar.update();

    this.startIdleFlow();
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}
