import { observable, action } from "mobx";
import localStorage from "store";

class StoredSettings {
  private defaultStartingLevel = 0;
  private defaultStartingGold = 0;
  private defaultHasSeenTutorial = false;
  @observable startingLevel: number = this.defaultStartingLevel;
  @observable startingGold: number = this.defaultStartingGold;
  @observable hasSeenTutorial: boolean = this.defaultHasSeenTutorial;

  constructor() {
    if (!IS_PRODUCTION) {
      this.startingLevel = localStorage.get("startingLevel") ?? this.defaultStartingLevel;
      this.startingGold = localStorage.get("startingGold") ?? this.defaultStartingGold;
      this.hasSeenTutorial = localStorage.get("hasSeenTutorial") ?? this.defaultHasSeenTutorial;
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

  @action setHasSeenTutorial(hasSeenTutorial: boolean) {
    this.hasSeenTutorial = hasSeenTutorial;
    localStorage.set("hasSeenTutorial", this.hasSeenTutorial);
  }
}

const storedSettings = new StoredSettings();

export default storedSettings;
