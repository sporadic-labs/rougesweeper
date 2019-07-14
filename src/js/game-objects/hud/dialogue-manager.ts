/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/events";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import Tile from "../level/tile";
import { GameStore } from "../../store/index";
import { getDialogueKey } from "../../store/levels";

const baseTextStyle = {
  fill: "#ffffff"
};
const titleStyle = {
  ...baseTextStyle,
  align: "center",
  fontSize: 30,
  fontStyle: "bold"
};
const textStyle = {
  ...baseTextStyle,
  fontSize: 18
};

export interface TileDialogueEntry {
  level: string;
  x: number;
  y: number;
  entries: DialogueEntry[];
  repeat: number; // -1 for infinite repeat
  condition: () => boolean;
}

export interface DialogueEntry {
  title: string;
  imageKey: string;
  text: string[];
}

const DEFAULT_DIALOGUE_ENTRY: DialogueEntry = {
  title: "Default",
  imageKey: "",
  text: []
};

enum DIALOGUE_STATES {
  EMPTY = "EMPTY",
  WRITING = "WRITING",
  OPEN = "OPEN",
  CLOSED = "CLOSED"
}

export default class DialogueManager {
  private scene: Phaser.Scene;
  private gameStore: GameStore;
  private skipButton: TextButton;
  private proxy: EventProxy;
  private container: Phaser.GameObjects.Container;
  private previousGameState: GAME_MODES;
  private isOpen: boolean = false;

  private state: DIALOGUE_STATES = DIALOGUE_STATES.CLOSED;

  private dialoguePages: DialogueEntry[] = [];
  private currentDialoguePage: DialogueEntry = DEFAULT_DIALOGUE_ENTRY;

  private line: string[] = [];

  private wordIndex: number = 0;
  private lineIndex: number = 0;
  private pageIndex: number = 0;

  private wordDelay: number = 96;
  private lineDelay: number = 184;

  private title: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.gameStore = gameStore;

    const width = Number(scene.game.config.width);
    const height = Number(scene.game.config.height);
    const modalWidth = width;
    const modalHeight = 0.32 * height;

    const r = new Phaser.Geom.Rectangle(
      (width - modalWidth) / 2,
      height - modalHeight,
      modalWidth,
      modalHeight
    );
    const background = scene.add.graphics();
    background.fillStyle(0xbcbcbc);
    background.fillRect(r.x, r.y, r.width, r.height);

    this.title = scene.add
      .text(r.centerX, r.y + 16, "Dialogue Dialog", titleStyle)
      .setOrigin(0.5, 0);

    this.text = scene.add
      .text(r.centerX, r.y + 56, "", baseTextStyle)
      .setOrigin(0.5, 0)
      .setLineSpacing(6)
      .setFixedSize(modalWidth * 0.8, modalHeight * 0.6)
      .setWordWrapWidth(modalWidth * 0.8);

    const continueButton = new TextButton(scene, r.right - 172, r.bottom - 20, "Next", {
      origin: { x: 0.5, y: 1 }
    });
    continueButton.events.on("DOWN", this.nextState, this);
    const skipButton = new TextButton(scene, r.right - 64, r.bottom - 20, "Skip", {
      origin: { x: 0.5, y: 1 }
    });
    skipButton.events.on("DOWN", this.close, this);

    this.container = scene.add
      .container(0, 0, [background, this.title, this.text, continueButton.text, skipButton.text])
      .setDepth(DEPTHS.HUD)
      .setVisible(false);

    scene.input.keyboard.on("keydown_M", () => {
      if (this.isOpen) this.close();
      else this.open();
    });

    scene.input.keyboard.on("keydown_N", () => {
      this.nextState();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  getDialogueDataForTile(level: string, x: number, y: number): TileDialogueEntry {
    const key = getDialogueKey(level, { x, y });
    return this.scene.cache.json.get(`${key}`);
  }

  playDialogueFromTile(tile: Tile) {
    const data = tile.getDialogueData();
    if (data && (data.repeat < 0 || data.repeat >= tile.dialoguePlayedCounter)) {
      this.setDialoguePages(data.entries);
      this.open();
      tile.dialoguePlayedCounter++;
    }
  }

  nextState() {
    switch (this.state) {
      case DIALOGUE_STATES.EMPTY:
        this.nextLine();
        break;
      case DIALOGUE_STATES.WRITING:
        this.complete();
        break;
      case DIALOGUE_STATES.CLOSED:
        this.open();
        break;
      case DIALOGUE_STATES.OPEN:
      default:
        if (this.pageIndex < this.dialoguePages.length - 1) {
          this.nextPage();
        } else {
          this.close();
        }
        break;
    }
  }

  nextWord() {
    //  Add the next word onto the text string, followed by a space
    const word = this.line[this.wordIndex];
    if (word) this.text.text = this.text.text.concat(`${word} `);

    //  Advance the word index to the next word in the line
    this.wordIndex++;

    //  Last word?
    if (this.wordIndex === this.line.length) {
      //  Add a carriage return
      this.text.text = this.text.text.concat("\n");

      //  Get the next line after the lineDelay amount of ms has elapsed
      this.scene.time.addEvent({
        callback: this.nextLine,
        delay: this.lineDelay,
        callbackScope: this
      });
    }
  }

  nextLine() {
    this.state = DIALOGUE_STATES.WRITING;

    // If we're at the end, bail.
    if (this.lineIndex === this.currentDialoguePage.text.length) {
      this.state = DIALOGUE_STATES.OPEN;
      return;
    }

    //  Split the current line on spaces, so one word per array element
    this.line = this.currentDialoguePage.text[this.lineIndex].split(" ");

    //  Reset the word index to zero (the first word in the line)
    this.wordIndex = 0;

    //  Call the 'nextWord' function once for each word in the line (line.length)
    this.scene.time.addEvent({
      callback: this.nextWord,
      repeat: this.line.length,
      delay: this.wordDelay,
      callbackScope: this
    });

    //  Advance to the next line
    this.lineIndex++;
  }

  nextPage() {
    this.reset();
    this.pageIndex++;
    this.currentDialoguePage = this.dialoguePages[this.pageIndex];
    this.title.setText(this.currentDialoguePage.title);
    this.nextState();
  }

  complete() {
    this.state = DIALOGUE_STATES.OPEN;
    this.scene.time.removeAllEvents();
    // TODO(rex): Do this for real?
    const text = this.currentDialoguePage.text.join("\n");
    this.text.setText(text);
  }

  open() {
    this.state = DIALOGUE_STATES.OPEN;
    this.isOpen = true;
    this.currentDialoguePage = this.dialoguePages[this.pageIndex];
    this.title.setText(this.currentDialoguePage.title);
    this.container.setVisible(true);
    this.previousGameState = this.gameStore.gameState;
    this.nextLine();
  }

  close() {
    this.isOpen = false;
    this.container.setVisible(false);
    this.gameStore.setGameState(this.previousGameState);
    this.reset();
    this.pageIndex = 0;
    this.scene.time.removeAllEvents();
    this.state = DIALOGUE_STATES.CLOSED;
  }

  reset() {
    this.currentDialoguePage = DEFAULT_DIALOGUE_ENTRY;
    this.title.setText("");
    this.text.setText("");
    this.lineIndex = 0;
    this.wordIndex = 0;
    this.state = DIALOGUE_STATES.EMPTY;
  }

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
  }

  setDialoguePages(entries: DialogueEntry[]) {
    this.dialoguePages = entries;
  }

  destroy() {
    this.scene.input.removeAllListeners();
    this.scene.time.removeAllEvents();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
