import { makeAutoObservable } from "mobx";
import GAME_MODES from "../game-objects/game-manager/game-modes";
import TILE_TYPES from "../game-objects/level/tile-types";
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

interface TutorialFlags {
  hasWeapon: boolean;
  hasSeenEnemy: boolean;
  hasSeenScrambleEnemy: boolean;
  hasSeenScrambledTile: boolean;
  hasSeenSuperEnemy: boolean;
  hasSeenBoss: boolean;
  hasSeenAmmo: boolean;
  hasSeenSniper: boolean;
  hasSeenEmp: boolean;
  hasSeenCompass: boolean;
  hasSeenUpgrade: boolean;
  hasSeenResetAlarm: boolean;
}

class GameStore {
  previousGameState: GAME_MODES;
  gameState: GAME_MODES;
  dangerCount: number;
  goldCount: number;
  maxPlayerHealth: number;
  playerHealth: number;
  moveCount: number;
  enemiesDefeated: number;
  levelIndex: number;
  hasKey: boolean;
  maxPlayerAmmo: number;
  playerAmmo: number;
  pauseMenuOpen: boolean;
  hasSeenTutorial: boolean;
  hasWeapon: boolean;
  tutorialFlags: TutorialFlags;

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
  removeAllAmmo() {
    this.items.hack.ammo = 0;
    this.items.revealTile.ammo = 0;
    this.items.clearRadar.ammo = 0;
    this.items.compass.ammo = 0;
  }
  unlockItem(itemName: ItemKey) {
    this.items[itemName].hasUnlocked = true;
  }
  upgradeItems() {
    this.items.hack.capacity += 5;
    this.items.revealTile.capacity += 1;
    this.items.clearRadar.capacity += 1;
    this.items.compass.capacity += 1;
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
  addEnemiesDefeated(amt = 1) {
    if (this.enemiesDefeated >= 0) this.enemiesDefeated += amt;
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

  setHasWeapon(hasWeapon: boolean) {
    this.hasWeapon = hasWeapon;
  }

  setHasSeenTutorial(hasSeenTutorial: boolean) {
    this.hasSeenTutorial = hasSeenTutorial;
    storedSettings.setHasSeenTutorial(hasSeenTutorial);
  }

  // hasWeapon: boolean;
  // hasSeenEnemy: boolean;
  // hasSeenScrambleEnemy: boolean;
  // hasSeenScrambledTile: boolean;
  // hasSeenSuperEnemy: boolean;
  // hasSeenBoss: boolean;
  // hasSeenAmmo: boolean;
  // hasSeenSniper: boolean;
  // hasSeenEmp: boolean;
  // hasSeenCompass: boolean;
  // hasSeenUpgrade: boolean;
  // hasSeenResetAlarm: boolean;

  setTutorialFlag(tile: TILE_TYPES) {
    if (tile === TILE_TYPES.ENEMY) {
      this.tutorialFlags.hasSeenEnemy = true;
    } else if (tile === TILE_TYPES.SCRAMBLE_ENEMY) {
      this.tutorialFlags.hasSeenScrambleEnemy = true;
    } else if (tile === TILE_TYPES.SUPER_ENEMY) {
      this.tutorialFlags.hasSeenSuperEnemy = true;
    } else if (tile === TILE_TYPES.AMMO) {
      this.tutorialFlags.hasSeenAmmo = true;
    } else if (tile === TILE_TYPES.SNIPER) {
      this.tutorialFlags.hasSeenSniper = true;
    } else if (tile === TILE_TYPES.EMP) {
      this.tutorialFlags.hasSeenEmp = true;
    } else if (tile === TILE_TYPES.COMPASS) {
      this.tutorialFlags.hasSeenCompass = true;
    } else if (tile === TILE_TYPES.UPGRADE) {
      this.tutorialFlags.hasSeenUpgrade = true;
    }
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
    this.enemiesDefeated = 0;
    // NOTE(rex): If we have already seen the tutorial, skip to level 1.
    this.levelIndex =
      storedSettings.startingLevel === 0 && storedSettings.hasSeenTutorial
        ? 1
        : storedSettings.startingLevel;
    this.hasKey = false;
    this.hasSeenTutorial = storedSettings.hasSeenTutorial;
    const hasWeapon = storedSettings.hasSeenTutorial ? true : false
    this.hasWeapon = hasWeapon;
    this.pauseMenuOpen = false;
    this.activeItemKey = "hack";
    this.items = {
      hack: {
        key: "hack",
        imageKey: "weapon-icon-v2",
        label: "Hack",
        ammo: hasWeapon ? 10 : 0,
        capacity: 10,
        hasUnlocked: true,
      },
      revealTile: {
        key: "revealTile",
        imageKey: "sniper-pickup-v2",
        label: "Snipe",
        ammo: 0,
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
      clearRadar: {
        key: "clearRadar",
        imageKey: "emp-pickup-v2",
        label: "EMP",
        ammo: 0,
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
      compass: {
        key: "compass",
        imageKey: "compass-pickup-v2",
        label: "Compass",
        ammo: 0,
        capacity: 1,
        hasUnlocked: true, // Should be false to start, testing
      },
    };
    this.tutorialFlags = {
      hasWeapon,
      hasSeenEnemy: false,
      hasSeenScrambleEnemy: false,
      hasSeenSuperEnemy: false,
      hasSeenBoss: false,
      hasSeenAmmo: false,
      hasSeenSniper: false,
      hasSeenEmp: false,
      hasSeenCompass: false,
      hasSeenUpgrade: false,
      hasSeenResetAlarm: false,
      hasSeenScrambledTile: false,
    }
  }
}

const store = new GameStore();

export default store;
export { GameStore };
