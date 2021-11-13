/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Level from "./level";
import LEVEL_EVENTS from "./events";

export default class TutorialLogic {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;

  constructor(scene: Phaser.Scene, level: Level, levelKey: string) {
    this.scene = scene;
    this.level = level;
    this.levelKey = levelKey;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    const isTutorialLevel = levelKey === "level-1-floor-1";
    console.log("tut");
    if (isTutorialLevel) {
      this.level.events.addListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
      this.level.events.addListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
    }
  }

  async onExitClick() {
    // Hide everything when you touched the locked door
    if (this.levelKey === "level-1-floor-1") {
      this.level.events.once(LEVEL_EVENTS.PLAYER_FINISHED_MOVE, () => {
        this.level.forEachTile(t => {
          t.flipToBack();
        });
      });
    }
  }

  async onLevelStart() {
    // Reveal everything at level start
    if (this.levelKey === "level-1-floor-1") {
      this.level.forEachTile(t => t.flipToFront());
    }
  }

  destroy() {
    this.level.events.removeListener(LEVEL_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.level.events.removeListener(LEVEL_EVENTS.EXIT_SELECT_PRIMARY, this.onExitClick, this);
    this.proxy.removeAll();
  }
}