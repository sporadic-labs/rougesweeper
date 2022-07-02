import { makeAutoObservable } from "mobx";
import GAME_MODES from "../game-objects/game-manager/game-modes";
import { levelKeys } from "./levels";
import storedSettings from "./stored-settings";

interface Item {
  hasUnlocked: boolean;
  ammo: number;
  capacity: number;
}

export type ItemName = "hack" | "revealTile" | "clearRadar" | "compass";

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
  pauseMenuOpen: boolean;

  // Inventory Stuff
  hack: Item;
  revealTile: Item;
  clearRadar: Item;
  compass: Item;
  activeItem: ItemName;

  constructor() {
    this.startNewGame();
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
  getAmmoForActiveItem() {
    return this[this.activeItem].ammo;
  }
  getActiveItemInfo() {
    return {
      name: this.activeItem,
      ammo: this[this.activeItem].ammo,
      capacity: this[this.activeItem].capacity,
    };
  }
  setAmmo(itemName: ItemName, amt: number) {
    this[itemName].ammo = Math.max(Math.min(amt, this[itemName].capacity), 0);
  }
  addAmmo(itemName: ItemName, amt: number) {
    this.setAmmo(itemName, this[itemName].ammo + amt);
  }
  removeAmmo(itemName: ItemName, amt: number) {
    this.setAmmo(itemName, this[itemName].ammo - amt);
  }
  unlockItem(itemName: ItemName) {
    this[itemName].hasUnlocked = true;
  }
  addHealth(amt = 1) {
    if (this.playerHealth <= this.maxPlayerHealth) this.playerHealth += amt;
  }
  removeHealth(amt = 1) {
    if (this.playerHealth > 0) this.playerHealth -= amt;
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

  startNewGame() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.previousGameState = this.gameState;
    this.dangerCount = 0;
    this.goldCount = storedSettings.startingGold;
    this.maxPlayerHealth = 4;
    this.playerHealth = this.maxPlayerHealth;
    this.moveCount = 0;
    this.levelIndex = storedSettings.startingLevel;
    this.hasKey = false;
    this.pauseMenuOpen = false;
    this.activeItem = "hack";
    this.hack = {
      ammo: 5,
      capacity: 5,
      hasUnlocked: true,
    };
    this.revealTile = {
      ammo: 0,
      capacity: 1,
      hasUnlocked: false,
    };
    this.clearRadar = {
      ammo: 0,
      capacity: 1,
      hasUnlocked: false,
    };
    this.compass = {
      ammo: 0,
      capacity: 1,
      hasUnlocked: false,
    };
  }
}

const store = new GameStore();

export default store;
export { GameStore };
