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
  isShopOpen: boolean;
  moveCount: number;
  hasCompass: boolean;
  hasRevealTile: boolean;
  hasClearRadar: boolean;
  levelIndex: number;
  hasKey: boolean;
  pauseMenuOpen: boolean;

  constructor() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.previousGameState = this.gameState;
    this.dangerCount = 0;
    this.goldCount = storedSettings.startingGold;
    this.maxPlayerHealth = 4;
    this.playerHealth = this.maxPlayerHealth;
    this.isShopOpen = false;
    this.moveCount = 0;
    this.hasCompass = false;
    this.hasRevealTile = false;
    this.hasClearRadar = false;
    this.levelIndex = storedSettings.startingLevel;
    this.hasKey = false;
    this.pauseMenuOpen = false;
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
  addHealth(amt = 1) {
    if (this.playerHealth <= this.maxPlayerHealth) this.playerHealth += amt;
  }
  removeHealth(amt = 1) {
    if (this.playerHealth > 0) this.playerHealth -= amt;
  }
  setShopOpen(isShopOpen: boolean) {
    this.isShopOpen = isShopOpen;
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

  startNewGame() {
    this.playerHealth = this.maxPlayerHealth;
    this.goldCount = storedSettings.startingGold;
    this.levelIndex = storedSettings.startingLevel;
    this.moveCount = 0;
    this.hasKey = false;
  }
}

const store = new GameStore();

export default store;
export { GameStore };
