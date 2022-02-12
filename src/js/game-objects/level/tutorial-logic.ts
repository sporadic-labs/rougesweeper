/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Level from "./level";
import LEVEL_EVENTS from "./events";
import DialogueManager from "../hud/dialogue-manager";
import store from "../../store";

interface FloorTutorial {
  destroy(): void;
}

class Level1Floor1Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor1Tutorial = false;

  constructor(scene: Phaser.Scene, dialogueManager: DialogueManager, level: Level) {
    this.scene = scene;
    this.level = level;
    this.dialogueManager = dialogueManager;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.level.events.addListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.level.events.addListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
  }

  async onExitClick() {
    // Hide everything when you touched the locked door
    if (this.levelKey === "level-1-floor-1" && !this.hasFinishedFloor1Tutorial) {
      this.hasFinishedFloor1Tutorial = true;

      if (store.hasKey) {
        return;
      }

      this.level.events.once(LEVEL_EVENTS.PLAYER_FINISHED_MOVE, () => {
        this.dialogueManager.playDialogue({
          title: "Tutorial",
          imageKey: "marker-2",
          text: [
            "Ah! I must have tripped the security alarm. I need to find a key to get through.",
          ],
        });
        this.level.forEachTile((t) => {
          t.flipToBack();
        });
      });
    }
  }

  async onLevelStart() {
    this.dialogueManager.playDialogue({
      title: "Tutorial",
      imageKey: "marker-2",
      text: ["I need to get to the next level..."],
    });
    this.level.forEachTile((t) => t.flipToFront());
  }

  destroy() {
    this.level.events.removeListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.level.events.removeListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
    this.proxy.removeAll();
  }
}

class Level1Floor2Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor1Tutorial = false;

  constructor(scene: Phaser.Scene, dialogueManager: DialogueManager, level: Level) {
    this.scene = scene;
    this.level = level;
    this.dialogueManager = dialogueManager;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    /**
     * When radar goes from zero => non-zero for the first time
     * - "That alarm must have triggered the bots. My sensor can tell me how
     *   many are directly around me at any point."
     * - "I can hack them to silently eliminate them."
     * - [Right click on the tile directly in front of you.], maybe use arrow?
     */
  }

  destroy() {
    this.proxy.removeAll();
  }
}

export default class TutorialLogic {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor1Tutorial = false;
  private tutorial?: FloorTutorial;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    level: Level,
    levelKey: string
  ) {
    if (levelKey === "level-1-floor-1") {
      this.tutorial = new Level1Floor1Tutorial(scene, dialogueManager, level);
    } else if (levelKey === "level-1-floor-2") {
      this.tutorial = new Level1Floor2Tutorial(scene, dialogueManager, level);
    }
  }

  destroy() {
    this.tutorial?.destroy();
  }
}
