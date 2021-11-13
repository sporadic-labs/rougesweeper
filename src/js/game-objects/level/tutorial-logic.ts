/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Level from "./level";
import LEVEL_EVENTS from "./events";
import DialogueManager from "../hud/dialogue-manager";

export default class TutorialLogic {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor1Tutorial = false;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    level: Level,
    levelKey: string
  ) {
    this.scene = scene;
    this.level = level;
    this.levelKey = levelKey;
    this.dialogueManager = dialogueManager;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    const isTutorialLevel = levelKey === "level-1-floor-1";
    if (isTutorialLevel) {
      this.level.events.addListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
      this.level.events.addListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
    }
  }

  async onExitClick() {
    // Hide everything when you touched the locked door
    if (this.levelKey === "level-1-floor-1" && !this.hasFinishedFloor1Tutorial) {
      this.hasFinishedFloor1Tutorial = true;
      this.level.events.once(LEVEL_EVENTS.PLAYER_FINISHED_MOVE, () => {
        this.dialogueManager.playDialogue({
          title: "Tutorial",
          imageKey: "marker-2",
          text: ["Hello you need a key"]
        });
        this.level.forEachTile(t => {
          t.flipToBack();
        });
      });
    }
  }

  async onLevelStart() {
    // Reveal everything at level start
    if (this.levelKey === "level-1-floor-1") {
      this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "marker-2",
        text: ["Hello tutorial is starting"]
      });
      this.level.forEachTile(t => t.flipToFront());
    }
  }

  destroy() {
    this.level.events.removeListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.level.events.removeListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
    this.proxy.removeAll();
  }
}
