import { observable, action, decorate } from "mobx";

class GameStore {
  constructor() {
    this.dangerCount = 0;
  }

  setDangerCount(count) {
    this.dangerCount = count;
  }
}

decorate(GameStore, {
  dangerCount: observable,
  setDangerCount: action
});

const store = new GameStore();

export default store;
