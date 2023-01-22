/*
 * Sound Manager.
 */
import EventProxy from "../helpers/event-proxy";
import GAME_MODES from "./game-manager/game-modes";
import { GameStore } from "../store/index";
import constants from "../constants";

export default class SoundManager {
  private scene: Phaser.Scene;
  private gameStore: GameStore;
  private proxy: EventProxy;

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.gameStore = gameStore;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  destroy() {
    this.proxy.removeAll();
  }
}
