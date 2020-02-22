import { observable, action, autorun } from "mobx";
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
      autorun(() => {
        localStorage.set("startingLevel", this.startingLevel);
        localStorage.set("startingGold", this.startingGold);
      });
    }
  }

  @action setStartingLevel(startingLevel: number) {
    this.startingLevel = startingLevel;
  }

  @action setStartingGold(startingGold: number) {
    this.startingGold = startingGold;
  }
}

const storedSettings = new StoredSettings();

export default storedSettings;
