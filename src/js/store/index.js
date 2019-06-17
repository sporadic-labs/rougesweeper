import { observable, action, decorate } from "mobx";
import GAME_MODES from "../game-objects/game-manager/events";
import { levelKeys } from "./levels";

class GameStore {
  constructor() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.dangerCount = 0;
    this.goldCount = 0;
    this.maxPlayerHealth = 3;
    this.playerHealth = this.maxPlayerHealth;
    this.maxAttackCount = 3;
    this.attackCount = this.maxAttackCount;
    this.isShopOpen = false;
    this.moveCount = 0;
    this.hasCompass = false;
    this.levelIndex = 0;
    this.hasKey = false;
  }

  setGameState(state) {
    this.gameState = state;
  }
  setDangerCount(count) {
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
  addAttack(amt = 1) {
    if (this.attackCount <= this.maxAttackCount) this.attackCount += amt;
  }
  removeAttack(amt = 1) {
    if (this.attackCount > 0) this.attackCount -= amt;
  }
  setShopOpen(isShopOpen) {
    this.isShopOpen = isShopOpen;
  }
  setHasCompass(hasCompass) {
    this.hasCompass = hasCompass;
  }
  setHasKey(hasKey) {
    this.hasKey = hasKey;
  }
  addMove(amt = 1) {
    if (this.moveCount >= 0) this.moveCount += amt;
  }
  getLevel() {
    return levelKeys[this.levelIndex];
  }
  nextLevel() {
    if (this.levelIndex < levelKeys.length) this.levelIndex += 1;
  }
  startNewGame() {
    this.playerHealth = this.maxPlayerHealth;
    this.goldCount = 0;
    this.attackCount = this.maxAttackCount;
    this.levelIndex = 0;
    this.moveCount = 0;
    this.hasKey = false;
    this.levelIndex = 7;
  }
}

decorate(GameStore, {
  gameState: observable,
  setGameState: action,
  dangerCount: observable,
  setDangerCount: action,
  goldCount: observable,
  addGold: action,
  removeGold: action,
  playerHealth: observable,
  addHealth: action,
  removeHealth: action,
  attackCount: observable,
  addAttack: action,
  removeAttack: action,
  isShopOpen: observable,
  setShopOpen: action,
  hasCompass: observable,
  setHasCompass: action,
  hasKey: observable,
  setHasKey: action,
  moveCount: observable,
  addMove: action,
  level: observable,
  nextLevel: action,
  startNewGame: action
});

const store = new GameStore();

export default store;
