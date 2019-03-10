import { observable, action, decorate } from "mobx";
import GAME_MODES from "../game-objects/game-manager/events";

class GameStore {
  constructor() {
    this.gameState = GAME_MODES.IDLE_MODE;
    this.dangerCount = 0;
    this.goldCount = 0;
    this.maxPlayerHealth = 3;
    this.playerHealth = this.maxPlayerHealth;
    this.maxAttackCount = 3;
    this.attackCount = this.maxAttackCount;
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
    if (this.playerHealth > 0) {
      this.playerHealth -= amt;
    } else {
      console.log("Game Over, Man...");
    }
  }
  addAttack(amt = 1) {
    if (this.attackCount <= this.maxAttackCount) this.attackCount += amt;
  }
  removeAttack(amt = 1) {
    if (this.attackCount > 0) this.attackCount -= amt;
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
  removeAttack: action
});

const store = new GameStore();

export default store;
