import { Scene } from "phaser";
import Player from "../game-objects/player/index";
import GameManager from "../game-objects/game-manager/index";
import AlertIndicator from "../game-objects/hud/alert-indicator";
import PauseToggle from "../game-objects/hud/pause-toggle";
import LevelIndicator from "../game-objects/hud/level-indicator";
import store from "../store/index";
import ToastManager from "../game-objects/hud/toast-manager";
import ItemSwitcher from "../game-objects/hud/item-switcher";
import DebugTips from "../game-objects/hud/debug-tips";

export default class MainScene extends Scene {
  create() {
    store.startNewGame();

    const player = new Player(this, 0, 0);
    const toastManager = new ToastManager(this);
    new GameManager(this, player, toastManager);

    new AlertIndicator(this, store);
    new ItemSwitcher(this, store);
    new PauseToggle(this, store);
    new LevelIndicator(this, store);
    new DebugTips(this);
  }
}
