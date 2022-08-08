/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import Level from "./level";
import DialogueManager from "../hud/dialogue-manager";
import store from "../../store";
import { GameEmitter, GAME_EVENTS } from "../game-manager/events";
import TILE_TYPES from "./tile-types";
import Player from "../player";

interface FloorTutorial {
  onLevelStart(): void;
  onTileClick(pickup: TILE_TYPES): Promise<void>;
  onExitClick(): void;
  onPlayerFinishMove(): Promise<void>;
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

class Level0Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
  private hasFinishedFloor0Tutorial = false;
  private hasSeenAnEnemy = false;
  private gameEvents: GameEmitter;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    level: Level,
    player: Player,
    gameEvents: GameEmitter
  ) {
    this.scene = scene;
    this.level = level;
    this.dialogueManager = dialogueManager;
    this.gameEvents = gameEvents;
    this.player = player;

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.gameEvents.addListener(GAME_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.gameEvents.addListener(GAME_EVENTS.EXIT_SELECT, this.onExitClick, this);
    this.gameEvents.addListener(GAME_EVENTS.PLAYER_FINISHED_MOVE, this.onPlayerFinishMove, this);

    this.level.forEachTile((t) => {
      if (t.type === TILE_TYPES.ENEMY || t.type === TILE_TYPES.KEY) t.flipToFront(false);
      else t.flipToFront();
    });
  }

  async onLevelStart() {
    this.dialogueManager.playDialogue({
      title: "Tutorial",
      imageKey: "player-m",
      text: [
        "I finally made it into the enemy HQ!",
        "Need to move quickly to find the stolen tech!",
        "Left-Click on an Empty Tile to move to it.",
      ],
    });
  }

  async onExitClick() {
    // Hide everything when you touched the locked door
    if (store.hasKey) {
      store.setHasSeenTutorial(true);
      return;
    }

    this.dialogueManager.playDialogue({
      title: "Tutorial",
      imageKey: "player-m",
      text: [
        "I need to find a key to get through!",
        "Find the Key pickup hidden somewhere in the level.",
      ],
    });
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.WEAPON) {
      this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "player-m",
          text: [
            "Ah! I must have tripped the security alarm.",
            "Need to move carefully!",
            "Left-Click a Hidden Tile to reveal it.",
          ],
        },
        {
          title: "Tutorial",
          imageKey: "player-m",
          text: [
            "This futuristic weapon will help me hack the system!",
            "Right-Click to use the equipped weapon.  Use the Arrow Keys to cycle through weapons.",
          ],
        },
      ]);

      // Hide everything when you pickup the weapon
      const playerGridPos = this.player.getGridPosition();
      const tilesAroundPlayer = this.level.getNeighboringTiles(playerGridPos.x, playerGridPos.y);
      this.level.forEachTile((t) => {
        // Figure out if the tiles are around the player.
        if (
          tilesAroundPlayer.includes(t) ||
          (t.gridX === playerGridPos.x && t.gridY === playerGridPos.y)
        ) {
          // Do nothing...
        } else {
          t.flipToBack();
        }
      });
    } else if (tileType === TILE_TYPES.KEY) {
      this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "player-m",
        text: [
          "This Key should let me get through that locked door!",
          "Once you have cleared a path, Left-Click the Door to move on to the next level.",
        ],
      });
    } else if (tileType === TILE_TYPES.ENEMY) {
      this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "player-m",
          text: [
            "That drone was communicating with the security system...",
            "I need to hack the enemy drones before I am seen!",
          ],
        },
        {
          title: "Tutorial",
          imageKey: "player-m",
          text: [
            "Hacking a drone will remove it as a threat.",
            "Revealing a drone without hacking it will increase your Alert Level.",
          ],
        },
      ]);
    }
  }

  async onPlayerFinishMove() {
    const playerGridPos = this.player.getGridPosition();
    const enemyCount = this.level.countNeighboringEnemies(playerGridPos.x, playerGridPos.y);
    if (enemyCount > 0 && !this.hasSeenAnEnemy) {
      this.hasSeenAnEnemy = true;
      this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "player-m",
        text: ["This radar is blaring...", "An enemy must be nearby!", "Equip 'Hack' and Right-Click on the hidden tile with the Enemy to neutralize the threat."],
      });
    }
  }

  destroy() {
    this.gameEvents.removeListener(GAME_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.gameEvents.removeListener(GAME_EVENTS.EXIT_SELECT, this.onExitClick, this);
    this.gameEvents.removeListener(GAME_EVENTS.PLAYER_FINISHED_MOVE, this.onPlayerFinishMove, this);
    this.proxy.removeAll();
  }
}

export default class TutorialLogic {
  private scene: Phaser.Scene;
  private player: Player;
  private level: Level;
  private levelKey: string;
  private dialogueManager: DialogueManager;
  private tutorial?: FloorTutorial;

  constructor(
    scene: Phaser.Scene,
    dialogueManager: DialogueManager,
    level: Level,
    levelKey: string,
    player: Player,
    gameEvents: GameEmitter
  ) {
    this.levelKey = levelKey;
    if (levelKey === "level-00") {
      this.tutorial = new Level0Tutorial(scene, dialogueManager, level, player, gameEvents);
    }
  }

  async onTileClick(tileType: TILE_TYPES) {
    await this.tutorial?.onTileClick(tileType);
  }

  destroy() {
    this.tutorial?.destroy();
  }
}
