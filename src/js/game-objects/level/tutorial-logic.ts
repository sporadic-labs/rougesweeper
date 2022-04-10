/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Level from "./level";
import DialogueManager from "../hud/dialogue-manager";
import store from "../../store";
import { GameEmitter, GAME_EVENTS } from "../game-manager/events";

interface FloorTutorial {
  destroy(): void;
}

/**
 * TODO aspects of the tutorial:
 *
 * > hasSeenEnemy
 * > when player has finished move, if in range of enemy, trigger dialogue
 * > if you click on enemy, also trigger
 *
 * > hasSeenMovePrompt
 * > onLoad, trigger dialogue and pause while waiting for the player to move
 */

class Level1Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor1Tutorial = false;
  private gameEvents: GameEmitter;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    level: Level,
    gameEvents: GameEmitter
  ) {
    this.scene = scene;
    this.level = level;
    this.dialogueManager = dialogueManager;
    this.gameEvents = gameEvents;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.gameEvents.addListener(GAME_EVENTS.EXIT_SELECT, this.onExitClick, this);

    this.level.flipAllTiles();
  }

  async onExitClick() {
    // Hide everything when you touched the locked door
    if (!this.hasFinishedFloor1Tutorial) {
      this.hasFinishedFloor1Tutorial = true;

      if (store.hasKey) {
        return;
      }

      this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "marker-2",
        text: ["Ah! I must have tripped the security alarm. I need to find a key to get through."],
      });
      this.level.forEachTile((t) => {
        t.flipToBack();
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
    this.gameEvents.removeListener(GAME_EVENTS.EXIT_SELECT, this.onExitClick, this);
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
    levelKey: string,
    gameEvents: GameEmitter
  ) {
    this.levelKey = levelKey;
    if (levelKey === "level-01") {
      this.tutorial = new Level1Tutorial(scene, dialogueManager, level, gameEvents);
    }
  }

  destroy() {
    this.tutorial?.destroy();
  }
}
