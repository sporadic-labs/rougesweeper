import { makeAutoObservable } from "mobx";
import GAME_MODES from "../game-objects/game-manager/events";
import { levelKeys } from "./levels";
import storedSettings from "./stored-settings";

class GameStore {
  previousGameState: GAME_MODES;
  gameState: GAME_MODES;
  dangerCount: number;
  goldCount: number;
  maxPlayerHealth: number;
  playerHealth: number;
  moveCount: number;
  levelIndex: number;
  hasKey: boolean;
  maxPlayerAmmo: number;
  playerAmmo: number;

  // Menu Stuff
  isShopOpen: boolean;
  isShopUnlockOpen: boolean;
  pauseMenuOpen: boolean;

  // Inventory Stuff
  hasCompass: boolean;
  hasRevealTile: boolean;
  hasClearRadar: boolean;

  // Inventory Progression stuff.
  shopLocked: boolean;
  ammoLocked: boolean;
  compassLocked: boolean;
  clearRadarLocked: boolean;
  revealTileLocked: boolean;

  constructor() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.previousGameState = this.gameState;
    this.dangerCount = 0;
    this.goldCount = storedSettings.startingGold;
    this.maxPlayerAmmo = 5;
    this.playerAmmo = 5;
    this.maxPlayerHealth = 4;
    this.playerHealth = this.maxPlayerHealth;
    this.moveCount = 0;
    this.levelIndex = storedSettings.startingLevel;
    this.hasKey = false;
    
    this.isShopOpen = false;
    this.isShopUnlockOpen = false;
    this.pauseMenuOpen = false;
    
    this.hasCompass = false;
    this.hasRevealTile = false;
    this.hasClearRadar = false;

    this.shopLocked = false;
    this.ammoLocked = true;
    this.compassLocked = true;
    this.clearRadarLocked = true;
    this.revealTileLocked = true;

    makeAutoObservable(this);
  }

  setGameState(state: GAME_MODES) {
    this.previousGameState = this.gameState;
    this.gameState = state;
  }
  goToPreviousGameState() {
    this.gameState = this.previousGameState;
  }
  setDangerCount(count: number) {
    this.dangerCount = count;
  }
  addGold(amt = 1) {
    if (this.goldCount >= 0) this.goldCount += amt;
  }
  removeGold(amt = 1) {
    if (this.goldCount > 0) this.goldCount -= amt;
  }
  setAmmo(amt = 1) {
    if (this.playerAmmo <= this.maxPlayerAmmo) this.playerAmmo = amt;
    else this.playerAmmo = this.maxPlayerAmmo;
  }
  addAmmo(amt = 1) {
    if (this.playerAmmo <= this.maxPlayerAmmo) this.playerAmmo += amt;
  }
  removeAmmo(amt = 1) {
    if (this.playerAmmo > 0) this.playerAmmo -= amt;
  }
  addHealth(amt = 1) {
    if (this.playerHealth <= this.maxPlayerHealth) this.playerHealth += amt;
  }
  removeHealth(amt = 1) {
    if (this.playerHealth > 0) this.playerHealth -= amt;
  }
  setShopOpen(isShopOpen: boolean) {
    this.isShopOpen = isShopOpen;
  }
  setShopUnlockOpen(isShopUnlockOpen: boolean) {
    this.isShopUnlockOpen = isShopUnlockOpen;
  }
  setHasCompass(hasCompass: boolean) {
    this.hasCompass = hasCompass;
  }
  setHasRevealTile(hasRevealTile: boolean) {
    this.hasRevealTile = hasRevealTile;
  }
  setHasClearRadar(hasClearRadar: boolean) {
    this.hasClearRadar = hasClearRadar;
  }
  setHasKey(hasKey: boolean) {
    this.hasKey = hasKey;
  }
  addMove(amt = 1) {
    if (this.moveCount >= 0) this.moveCount += amt;
  }
  nextLevel() {
    if (this.levelIndex < levelKeys.length) this.levelIndex += 1;
  }
  setLevelByIndex(levelIndex: number) {
    if (levelIndex >= 0 && levelIndex < levelKeys.length) this.levelIndex = levelIndex;
  }

  get level() {
    return levelKeys[this.levelIndex];
  }

  setPauseMenuOpen(pauseMenuOpen: boolean) {
    this.pauseMenuOpen = pauseMenuOpen;
  }

  setShopLocked(locked: boolean) {
    this.shopLocked = locked;
  }

  setAmmoLocked(locked: boolean) {
    this.ammoLocked = locked;
  }

  setClearRadarLocked(locked: boolean) {
    this.clearRadarLocked = locked;
  }

  setRevealTileLocked(locked: boolean) {
    this.revealTileLocked = locked;
  }

  setCompassLocked(locked: boolean) {
    this.compassLocked = locked;
  }

  startNewGame() {
    this.playerHealth = this.maxPlayerHealth;
    this.goldCount = storedSettings.startingGold;
    this.levelIndex = storedSettings.startingLevel;
    this.moveCount = 0;
    this.hasKey = false;

    this.shopLocked = false;
    this.ammoLocked = true;
    this.clearRadarLocked = true;
    this.revealTileLocked = true;
    this.compassLocked = true;
  }
}

const store = new GameStore();

export default store;
export { GameStore };
