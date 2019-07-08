/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Tile from "../level/tile";
import { GameStore } from "../../store/index";
import DialogueScreen from "./dialogue-screen";
import DialogueData from "./dialogue-data";

export default class DialogueManager {
  private scene: Phaser.Scene;
  private proxy: EventProxy;

  private dialogueScreen: DialogueScreen;
  private dialogueData: DialogueData;

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.dialogueScreen = new DialogueScreen(this.scene, gameStore);
    this.dialogueData = new DialogueData();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  playDialogueFromTile(tile: Tile) {
    const data = this.dialogueData.getDialogueDataForTile(tile);
    if (data && (data.repeat || tile.dialoguePlayedCounter < 1)) {
      this.dialogueScreen.setDialoguePages(data.entries);
      this.dialogueScreen.open();
      tile.dialoguePlayedCounter++;
    }
  }

  destroy() {
    this.proxy.removeAll();
  }
}
