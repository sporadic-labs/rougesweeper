import { observable, action } from "mobx";
import localStorage from "store";

class StoredSettings {
  private defaultStartingLevel = 0;
  private defaultStartingGold = 0;
  private defaultHasSeenTutorial = false;
  private defaultMusicVolume = 1;
  private defaultSfxVolume = 1;
  @observable startingLevel: number = this.defaultStartingLevel;
  @observable startingGold: number = this.defaultStartingGold;
  @observable hasSeenTutorial: boolean = this.defaultHasSeenTutorial;
  @observable musicVolume: number = this.defaultMusicVolume;
  @observable sfxVolume: number = this.defaultSfxVolume;

  constructor() {
    if (!IS_PRODUCTION) {
      this.startingLevel = localStorage.get("startingLevel") ?? this.defaultStartingLevel;
      this.startingGold = localStorage.get("startingGold") ?? this.defaultStartingGold;
      this.hasSeenTutorial = localStorage.get("hasSeenTutorial") ?? this.defaultHasSeenTutorial;
      this.musicVolume = localStorage.get("musicVolume") ?? this.defaultMusicVolume;
      this.sfxVolume = localStorage.get("sfxVolume") ?? this.defaultSfxVolume;
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

  @action setMusicVolume(musicVolume: number) {
    this.musicVolume = musicVolume;
    localStorage.set("musicVolume", this.musicVolume);
  }

  @action setSfxVolume(sfxVolume: number) {
    this.sfxVolume = sfxVolume;
    localStorage.set("sfxVolume", this.sfxVolume);
  }
}

const storedSettings = new StoredSettings();

export default storedSettings;
