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

/** */
class Level0Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
  private hasSeenAnEnemy = false;
  private hasTriggeredTheAlarm = false; // NOTE(rex): This happens after you pick up the weapon...
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
      t.flipToFront({
        showContents: t.type !== TILE_TYPES.ENEMY && t.type !== TILE_TYPES.KEY,
      });
    });
  }

  async onLevelStart() {
    await this.dialogueManager.playDialogue({
      title: "Tutorial",
      imageKey: "character_01",
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

    await this.dialogueManager.playDialogue({
      title: "Tutorial",
      imageKey: "character_01",
      text: [
        "I need to find a key to get through!",
        "Find the Key pickup hidden somewhere in the level.",
      ],
    });
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.WEAPON) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "This futuristic weapon will help me hack the system!",
            "Right-Click to use the equipped weapon. Use the Arrow Keys to cycle through weapons.",
          ],
        },
      ]);
    } else if (tileType === TILE_TYPES.KEY) {
      await this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "character_01",
        text: [
          "This Key should let me get through that locked door!",
          "Once you have cleared a path, Left-Click the Door to move on to the next level.",
        ],
      });
    } else if (tileType === TILE_TYPES.ENEMY) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "enemySimple_01",
          text: [
            "That drone was communicating with the security system...",
            "I need to hack the enemy drones before I am seen!",
          ],
        },
        {
          title: "Tutorial",
          imageKey: "character_01",
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

    if (!this.hasTriggeredTheAlarm) {
      const tile = this.level.getTileFromGrid(playerGridPos.x, playerGridPos.y);
      if (tile.type === TILE_TYPES.WEAPON) {
        this.hasTriggeredTheAlarm = true;

        // Hide everything when you pickup the weapon
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

        await this.dialogueManager.playDialogue([
          {
            title: "Tutorial",
            imageKey: "character_01",
            text: [
              "Ah! I must have tripped the security alarm.",
              "Need to move carefully!",
              "Left-Click a Hidden Tile to reveal it.",
            ],
          },
        ]);
      }
    }

    if (!this.hasSeenAnEnemy) {
      const enemyCount = this.level.countNeighboringEnemies(playerGridPos.x, playerGridPos.y);
      if (enemyCount > 0) {
        this.hasSeenAnEnemy = true;
        await this.dialogueManager.playDialogue({
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "This radar is blaring...",
            "An enemy must be nearby!",
            "Equip 'Hack' and Right-Click on the hidden tile with the Enemy to neutralize the threat.",
          ],
        });
      }
    }
  }

  destroy() {
    this.gameEvents.removeListener(GAME_EVENTS.LEVEL_START, this.onLevelStart, this);
    this.gameEvents.removeListener(GAME_EVENTS.EXIT_SELECT, this.onExitClick, this);
    this.gameEvents.removeListener(GAME_EVENTS.PLAYER_FINISHED_MOVE, this.onPlayerFinishMove, this);
    this.proxy.removeAll();
  }
}

/** */
class Level1To9Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
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

    this.gameEvents.addListener(GAME_EVENTS.PLAYER_FINISHED_MOVE, this.onPlayerFinishMove, this);
  }

  async onLevelStart() {
    // no-op
  }

  async onExitClick() {
    // no-op
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.ENEMY && !store.tutorialFlags.hasSeenEnemy) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "enemySimple_01",
          text: [
            "This is a basic enemy drone.",
            "Hacking a drone will remove it as a threat.",
            "Revealing a drone without hacking it will increase the Alert Level.",
          ],
        },
      ]);
    } else if (
      tileType === TILE_TYPES.SCRAMBLE_ENEMY &&
      !store.tutorialFlags.hasSeenScrambleEnemy
    ) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "enemyScramble_01",
          text: [
            "This enemy drone is more advanced!",
            "It's defenses can scramble my radar!",
            "Gotta be extra cautious!",
          ],
        },
      ]);
    } else if (tileType === TILE_TYPES.SUPER_ENEMY && !store.tutorialFlags.hasSeenSuperEnemy) {
      await this.dialogueManager.playDialogue({
        title: "Tutorial",
        imageKey: "enemyTough_01",
        text: [
          "This enemy drone looks dangerous!",
          "If it spots me, it will increase the Alert Level by 2!",
        ],
      });
    } else if (tileType === TILE_TYPES.AMMO && !store.tutorialFlags.hasSeenAmmo) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "This is a refill for my Hacking Weapon!",
            "Whew, I needed that!  Better keep an eye out for more ammo...",
          ],
        },
      ]);
    } else if (tileType === TILE_TYPES.SNIPER && !store.tutorialFlags.hasSeenSniper) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "This Sniper Attachment will let me attack tiles that are outside of my normal range!",
          ],
        },
      ]);
    } else if (tileType === TILE_TYPES.EMP && !store.tutorialFlags.hasSeenEmp) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: ["This EMP Attachment will clear all of the tiles around my current position!"],
        },
      ]);
    } else if (tileType === TILE_TYPES.COMPASS && !store.tutorialFlags.hasSeenCompass) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: ["This Compass Attachment will do something useful, eventually!"],
        },
      ]);
    } else if (tileType === TILE_TYPES.UPGRADE && !store.tutorialFlags.hasSeenUpgrade) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "Wow! This Weapon Upgrade let's me hold more ammo for all of the Weapon Attachments!",
          ],
        },
      ]);
    } else if (tileType === TILE_TYPES.ALERT && !store.tutorialFlags.hasSeenResetAlarm) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "character_01",
          text: [
            "This item reduces the Alert Level by 1!",
            "I better be careful to avoid being seen!",
          ],
        },
      ]);
    }
    store.setTutorialFlag(tileType);
  }

  async onPlayerFinishMove() {
    if (!store.tutorialFlags.hasSeenScrambledTile) {
      const playerGridPos = this.player.getGridPosition();
      const tile = this.level.getTileFromGrid(playerGridPos.x, playerGridPos.y);
      const isTileScrambled = tile?.isScrambled ?? false;
      if (isTileScrambled) {
        await this.dialogueManager.playDialogue([
          {
            title: "Tutorial",
            imageKey: "character_01",
            text: ["Wha- My Radar is being scrambled...", "A powerful enemy must be nearby!"],
          },
        ]);
        store.setHasSeenScrambleTile();
      }
    }
  }

  destroy() {
    this.gameEvents.removeListener(GAME_EVENTS.PLAYER_FINISHED_MOVE, this.onPlayerFinishMove, this);
    this.proxy.removeAll();
  }
}

/** */
class Level10Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
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
  }

  async onLevelStart() {
    // no-op
  }

  async onExitClick() {
    // no-op
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.BOSS) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "boss_noArmor_01",
          text: [
            "Hello, Agent. I see you have discovered my plot...",
            "However, you are too late to stop me! If only you had more TIME...",
            "Ha Ha Ha!",
          ],
        },
      ]);
    }
  }

  async onPlayerFinishMove() {
    // no-op
  }

  destroy() {
    this.proxy.removeAll();
  }
}

/** */
class Level11Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
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
  }

  async onLevelStart() {
    // no-op
  }

  async onExitClick() {
    // no-op
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.BOSS) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "boss_01",
          text: [
            "We meet again, Agent.",
            "You are better than I originally thought...",
            "But you won't catch me again!",
          ],
        },
      ]);
    }
  }

  async onPlayerFinishMove() {
    // no-op
  }

  destroy() {
    this.proxy.removeAll();
  }
}

/** */
class Level12Tutorial implements FloorTutorial {
  private scene: Phaser.Scene;
  private proxy: EventProxy;
  private level: Level;
  private levelKey: string;
  private player: Player;
  private dialogueManager: DialogueManager;
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
  }

  async onLevelStart() {
    // no-op
  }

  async onExitClick() {
    // no-op
  }

  async onTileClick(tileType: TILE_TYPES) {
    if (tileType === TILE_TYPES.BOSS) {
      await this.dialogueManager.playDialogue([
        {
          title: "Tutorial",
          imageKey: "boss_01",
          text: ["Wha- How did you find me again!?!", "This is IMPOSSIBLE!", "Nooooooooo..."],
        },
      ]);
    }
  }

  async onPlayerFinishMove() {
    // no-op
  }

  destroy() {
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
    } else if (
      levelKey === "level-01" ||
      levelKey === "level-02" ||
      levelKey === "level-03" ||
      levelKey === "level-04" ||
      levelKey === "level-05" ||
      levelKey === "level-06" ||
      levelKey === "level-07" ||
      levelKey === "level-08" ||
      levelKey === "level-09"
    ) {
      this.tutorial = new Level1To9Tutorial(scene, dialogueManager, level, player, gameEvents);
    } else if (levelKey === "level-10") {
      this.tutorial = new Level10Tutorial(scene, dialogueManager, level, player, gameEvents);
    } else if (levelKey === "level-11") {
      this.tutorial = new Level11Tutorial(scene, dialogueManager, level, player, gameEvents);
    } else if (levelKey === "level-12") {
      this.tutorial = new Level12Tutorial(scene, dialogueManager, level, player, gameEvents);
    }
  }

  async onTileClick(tileType: TILE_TYPES) {
    await this.tutorial?.onTileClick(tileType);
  }

  destroy() {
    this.tutorial?.destroy();
  }
}
