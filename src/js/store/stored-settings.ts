import { observable, action } from "mobx";
import localStorage from "store";

class StoredSettings {
  private defaultStartingLevel = 0;
  private defaultStartingGold = 3;
  @observable startingLevel: number = this.defaultStartingLevel;
  @observable startingGold: number = this.defaultStartingGold;

  constructor() {
    if (!IS_PRODUCTION) {
      this.startingLevel = localStorage.get("startingLevel") ?? this.defaultStartingLevel;
      this.startingGold = localStorage.get("startingGold") ?? this.defaultStartingGold;
    }
  }

  @action setStartingLevel(startingLevel: number) {
    this.startingLevel = startingLevel;
    localStorage.set("startingLevel", this.startingLevel);
  }

  @action setStartingGold(startingGold: number) {
    this.startingGold = startingGold;
    localStorage.set("startingGold", this.startingGold);
  }
}

const storedSettings = new StoredSettings();

export default storedSettings;
