import { observable, action, decorate } from "mobx";

class GameStore {
  constructor() {
    this.dangerCount = 0;
    this.goldCount = 0;
    this.maxPlayerHealth = 3;
    this.playerHealth = this.maxPlayerHealth;
  }

  setDangerCount(count) {
    this.dangerCount = count;
  }
  addGold(amt = 1) {
    if (this.goldCount >= 0) this.goldCount += amt;
  }
  removeGold(amt = 1) {
    this.addGold(-1 * amt);
  }
  addHealth(amt = 1) {
    if (this.playerHealth <= this.maxPlayerHealth && this.playerHealth >= 0)
      this.playerHealth += amt;
  }
  removeHealth(amt = 1) {
    this.addHealth(-1 * amt);
  }
}

decorate(GameStore, {
  dangerCount: observable,
  setDangerCount: action,
  goldCount: observable,
  addGold: action,
  removeGold: action,
  playerHealth: observable,
  addHealth: action,
  removeHealth: action
});

const store = new GameStore();

export default store;
