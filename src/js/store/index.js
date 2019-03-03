import { observable, action, decorate } from "mobx";

class GameStore {
  constructor() {
    this.playerName = "";
  }

  setPlayerName(name) {
    this.playerName = name;
  }
}

decorate(GameStore, {
  playerName: observable,
  setPlayerName: action
});

const store = new GameStore();

export default store;
