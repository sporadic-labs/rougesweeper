import { makeAutoObservable } from "mobx";
import GAME_MODES from "../game-objects/game-manager/game-modes";
import { levelKeys } from "./levels";
import storedSettings from "./stored-settings";

interface Item {
  key: ItemKey;
  imageKey: string;
  label: string;
  hasUnlocked: boolean;
  ammo: number;
  capacity: number;
}

export type ItemKey = "hack" | "revealTile" | "clearRadar" | "compass";

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
  items: Record<ItemKey, Item>;
  activeItemKey: ItemKey;

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
  setAmmo(itemName: ItemKey, amt: number) {
    this.items[itemName].ammo = Math.max(Math.min(amt, this.items[itemName].capacity), 0);
  }
  addAmmo(itemName: ItemKey, amt: number) {
    this.setAmmo(itemName, this.items[itemName].ammo + amt);
  }
  removeAmmo(itemName: ItemKey, amt: number) {
    this.setAmmo(itemName, this.items[itemName].ammo - amt);
  }
  unlockItem(itemName: ItemKey) {
    this.items[itemName].hasUnlocked = true;
  }
  setActiveItem(itemName: ItemKey) {
    this.activeItemKey = itemName;
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

  get activeItemInfo() {
    return this.items[this.activeItemKey];
  }
  get activeItemIndex() {
    const index = this.unlockedItems.findIndex((item) => item.key === this.activeItemKey);
    if (index === -1) {
      throw new Error("Active item not found");
    }
    return index;
  }
  get level() {
    return levelKeys[this.levelIndex];
  }
  get allItems() {
    return Object.values(this.items);
  }
  get unlockedItems() {
    return this.allItems.filter((item) => item.hasUnlocked);
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
    this.activeItemKey = "hack";
    this.items = {
      hack: {
        key: "hack",
        imageKey: "tech-2",
        label: "Hack",
        ammo: 5,
        capacity: 5,
        hasUnlocked: true,
      },
      revealTile: {
        key: "revealTile",
        imageKey: "reveal-tile",
        label: "Reveal",
        ammo: 1, // Should be 0 to start, testing
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
      clearRadar: {
        key: "clearRadar",
        imageKey: "clear-radar",
        label: "Clear",
        ammo: 1, // Should be 0 to start, testing
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
      compass: {
        key: "compass",
        imageKey: "compass",
        label: "Compass",
        ammo: 1, // Should be 0 to start, testing
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
    };
  }
}

const store = new GameStore();

export default store;
export { GameStore };
