import { observable, action, computed } from "mobx";
import GAME_MODES from "../game-objects/game-manager/events";
import { levelKeys } from "./levels";

class GameStore {
  @observable previousGameState: GAME_MODES;
  @observable gameState: GAME_MODES;
  @observable dangerCount: number;
  @observable goldCount: number;
  @observable maxPlayerHealth: number;
  @observable playerHealth: number;
  @observable maxAttackCount: number;
  @observable attackCount: number;
  @observable isShopOpen: boolean;
  @observable moveCount: number;
  @observable hasCompass: boolean;
  @observable levelIndex: number;
  @observable hasKey: boolean;

  constructor() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.previousGameState = this.gameState;
    this.dangerCount = 0;
    this.goldCount = 0;
    this.maxPlayerHealth = 4;
    this.playerHealth = this.maxPlayerHealth;
    this.maxAttackCount = 3;
    this.attackCount = this.maxAttackCount;
    this.isShopOpen = false;
    this.moveCount = 0;
    this.hasCompass = false;
    this.levelIndex = 0;
    this.hasKey = false;
  }

  @action setGameState(state: GAME_MODES) {
    this.previousGameState = this.gameState;
    this.gameState = state;
  }
  @action goToPreviousGameState() {
    this.gameState = this.previousGameState;
  }
  @action setDangerCount(count: number) {
    this.dangerCount = count;
  }
  @action addGold(amt = 1) {
    if (this.goldCount >= 0) this.goldCount += amt;
  }
  @action removeGold(amt = 1) {
    if (this.goldCount > 0) this.goldCount -= amt;
  }
  @action addHealth(amt = 1) {
    if (this.playerHealth <= this.maxPlayerHealth) this.playerHealth += amt;
  }
  @action removeHealth(amt = 1) {
    if (this.playerHealth > 0) this.playerHealth -= amt;
  }
  @action addAttack(amt = 1) {
    if (this.attackCount <= this.maxAttackCount) this.attackCount += amt;
  }
  @action removeAttack(amt = 1) {
    if (this.attackCount > 0) this.attackCount -= amt;
  }
  @action setShopOpen(isShopOpen: boolean) {
    this.isShopOpen = isShopOpen;
  }
  @action setHasCompass(hasCompass: boolean) {
    this.hasCompass = hasCompass;
  }
  @action setHasKey(hasKey: boolean) {
    this.hasKey = hasKey;
  }
  @action addMove(amt = 1) {
    if (this.moveCount >= 0) this.moveCount += amt;
  }
  @action nextLevel() {
    if (this.levelIndex < levelKeys.length) this.levelIndex += 1;
  }
  @action setLevelByIndex(levelIndex: number) {
    if (levelIndex >= 0 && levelIndex < levelKeys.length) this.levelIndex = levelIndex;
  }

  @computed get level() {
    return levelKeys[this.levelIndex];
  }

  @action startNewGame() {
    this.playerHealth = this.maxPlayerHealth;
    this.goldCount = 3;
    this.attackCount = this.maxAttackCount;
    this.levelIndex = 0;
    this.moveCount = 0;
    this.hasKey = false;
  }
}

const store = new GameStore();

export default store;
export { GameStore };
