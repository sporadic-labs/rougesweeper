/*
 * Main Scene, where the game is played!
 */

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
import SoundManager from "../game-objects/sound-manager";
import DialogueManager from "../game-objects/hud/dialogue-manager";
import DebugMenu from "../game-objects/hud/debug-menu";
import PauseMenu from "../game-objects/hud/pause-menu";
import RandomPickupManager from "../game-objects/level/random-pickup-manager";

export default class MainScene extends Scene {
  create() {
    store.startNewGame();

    // Create the stuff needed for the game.
    const player = new Player(this, 0, 0);
    const toastManager = new ToastManager(this);
    const soundManager = new SoundManager(this, store);
    const dialogueManager = new DialogueManager(this, store, soundManager);
    const randomPickupManager = new RandomPickupManager();

    // Create the game manager.
    new GameManager(this, player, toastManager, dialogueManager, randomPickupManager, soundManager);

    // Create the menus...
    new DebugMenu(this, store, soundManager);
    new PauseMenu(this, store, soundManager);
    
    // And other HUD stuff!
    new AlertIndicator(this, store);
    new ItemSwitcher(this, store);
    new PauseToggle(this, store);
    new LevelIndicator(this, store);
    new DebugTips(this);
  }

  destroy() {
    // What needs to be destroyed?
  }
}
