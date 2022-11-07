/*
 * Dialogue Manager.
 */
import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";

const baseTextStyle = {
  color: "#ffffff",
};
const titleStyle = {
  ...baseTextStyle,
  align: "center",
  fontSize: "30px",
  fontStyle: "bold",
};
const textStyle = {
  ...baseTextStyle,
  fontSize: "22px",
};

export interface DialogueEntry {
  title: string;
  imageKey: string;
  text: string[];
}

enum DIALOGUE_STATES {
  EMPTY = "EMPTY",
  WRITING = "WRITING",
  OPEN = "OPEN",
  CLOSED = "CLOSED",
}

export default class DialogueManager {
  private scene: Phaser.Scene;
  private gameStore: GameStore;
  private proxy: EventProxy;
  private container: Phaser.GameObjects.Container;
  private previousGameState: GAME_MODES;
  private isCurrentlyOpen = false;
  private controls: { skipButton: TextButton; doneButton: TextButton; continueButton: TextButton };

  private state: DIALOGUE_STATES = DIALOGUE_STATES.CLOSED;

  private dialoguePages: DialogueEntry[] = [];
  private currentDialoguePage: DialogueEntry;

  private line: string[] = [];
  private word: string[] = [];

  private characterIndex = 0;
  private wordIndex = 0;
  private lineIndex = 0;
  private pageIndex = 0;
  private charactersPerSecond = 200;

  private title: Phaser.GameObjects.Text;
  private text: Phaser.GameObjects.Text;
  private sprite: Phaser.GameObjects.Sprite;

  private onComplete: (value?: unknown) => void

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
      .text(r.centerX, r.y + 32, "Dialogue Dialog", titleStyle)
      .setOrigin(0.5, 0.5);

    this.text = scene.add
      .text(r.centerX + 72, r.centerY + 12, "", textStyle)
      .setOrigin(0.5, 0.5)
      .setLineSpacing(6)
      .setFixedSize(modalWidth * 0.76, modalHeight * 0.6)
      .setWordWrapWidth(modalWidth * 0.76);

    this.sprite = scene.add.sprite(r.x + 36, r.centerY, "all-assets", "player-f").setOrigin(0, 0.5);

    const continueButton = new TextButton(scene, r.right - 172, r.bottom - 20, "Next", {
      origin: { x: 0.5, y: 1 },
    });
    continueButton.events.on("DOWN", this.nextState, this);
    const skipButton = new TextButton(scene, r.right - 64, r.bottom - 20, "Skip", {
      origin: { x: 0.5, y: 1 },
    });
    skipButton.events.on("DOWN", this.close, this);
    const doneButton = new TextButton(scene, r.right - 64, r.bottom - 20, "Done", {
      origin: { x: 0.5, y: 1 },
    });
    doneButton.events.on("DOWN", this.close, this);
    this.controls = { continueButton, doneButton, skipButton };

    this.container = scene.add
      .container(0, 0, [
        background,
        this.title,
        this.text,
        this.sprite,
        continueButton.text,
        skipButton.text,
        doneButton.text,
      ])
      .setDepth(DEPTHS.DIALOGUE)
      .setVisible(false);

    scene.input.keyboard.on("keydown-M", () => {
      this.nextState();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  get characterDelayMs() {
    return 1000 / this.charactersPerSecond;
  }

  isOpen() {
    return this.isCurrentlyOpen;
  }

  async playDialogue(dialogueEntryOrEntries: DialogueEntry[] | DialogueEntry) {
    const entries = Array.isArray(dialogueEntryOrEntries)
      ? dialogueEntryOrEntries
      : [dialogueEntryOrEntries];
    this.setDialoguePages(entries);
    if (this.isCurrentlyOpen) this.close();

    return new Promise((resolve, _reject) => {
      if (this.onComplete) {
        this.onComplete()
        this.onComplete = undefined
      }
      this.onComplete = resolve
      this.open()
    })
  }

  nextState() {
    this.updateButtons();
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

  nextCharacter() {
    //  Add the next word onto the text string, followed by a space
    const char = this.word[this.characterIndex];
    if (char) this.text.text = this.text.text.concat(char);

    //  Advance the word index to the next word in the line
    this.characterIndex++;

    //  Last word?
    if (this.characterIndex === this.word.length) {
      //  Add a carriage return
      this.text.text = this.text.text.concat(" ");

      //  Get the next line after the lineDelay amount of ms has elapsed
      this.scene.time.addEvent({
        callback: this.nextWord,
        delay: this.characterDelayMs,
        callbackScope: this,
      });
    } else {
      //  Get the next line after the lineDelay amount of ms has elapsed
      this.scene.time.addEvent({
        callback: this.nextCharacter,
        delay: this.characterDelayMs,
        callbackScope: this,
      });
    }
  }

  nextWord() {
    //  Add the next word onto the text string, followed by a space
    const word = this.line[this.wordIndex];
    if (word) this.word = word.split("");

    //  Advance the word index to the next word in the line
    this.characterIndex = 0;

    //  Last word?
    if (this.wordIndex === this.line.length) {
      //  Add a carriage return
      this.text.text = this.text.text.concat("\n");

      //  Get the next line after the lineDelay amount of ms has elapsed
      this.scene.time.addEvent({
        callback: this.nextLine,
        delay: this.characterDelayMs,
        callbackScope: this,
      });
    } else {
      this.wordIndex++;
      //  Get the next line after the lineDelay amount of ms has elapsed
      this.scene.time.addEvent({
        callback: this.nextCharacter,
        delay: this.characterDelayMs,
        callbackScope: this,
      });
    }
  }

  nextLine() {
    if (!this.currentDialoguePage) return;

    this.state = DIALOGUE_STATES.WRITING;

    // If we're at the end, bail.
    if (this.lineIndex === this.currentDialoguePage.text.length) {
      this.state = DIALOGUE_STATES.OPEN;
      return;
    }

    //  Split the current line on spaces, so one word per array element
    this.line = this.currentDialoguePage.text[this.lineIndex].split(" ");

    //  Reset the word index to zero (the first word in the line)
    this.characterIndex = 0;
    this.wordIndex = 0;

    //  Call the 'nextWord' function once for each word in the line (line.length)
    this.scene.time.addEvent({
      callback: this.nextWord,
      delay: this.characterDelayMs,
      callbackScope: this,
    });

    //  Advance to the next line
    this.lineIndex++;
  }

  nextPage() {
    this.reset();
    this.pageIndex++;
    this.currentDialoguePage = this.dialoguePages[this.pageIndex];
    this.sprite.setTexture("all-assets", this.currentDialoguePage.imageKey);
    this.title.setText(this.currentDialoguePage.title);
    this.nextState();
  }

  complete() {
    this.state = DIALOGUE_STATES.OPEN;
    this.scene.time.removeAllEvents();
    this.scene.time.clearPendingEvents();
    // TODO(rex): Do this for real?
    const text = this.currentDialoguePage.text.join("\n");
    this.text.setText(text);
  }

  open() {
    this.state = DIALOGUE_STATES.OPEN;
    this.isCurrentlyOpen = true;
    if (this.dialoguePages[this.pageIndex]) {
      this.currentDialoguePage = this.dialoguePages[this.pageIndex];
      this.sprite.setTexture("all-assets", this.currentDialoguePage.imageKey);
      this.title.setText(this.currentDialoguePage.title);
    }

    this.updateButtons();
    this.resetButtons();

    // Create Event listeners for easy control of the dialogue.
    this.scene.input.on(
      "pointerdown",
      (e: any) => {
        if (e.button === 0) this.nextState();
        else if (e.button === 2) this.close();
      },
      this
    );

    this.container.setVisible(true);
    this.previousGameState = this.gameStore.gameState;
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
    this.nextLine();
  }

  close() {
    this.isCurrentlyOpen = false;
    this.container.setVisible(false);
    this.gameStore.setGameState(this.previousGameState);
    this.scene.input.off("pointerdown");
    this.reset();
    this.pageIndex = 0;
    this.scene.time.removeAllEvents();
    this.scene.time.clearPendingEvents();
    this.state = DIALOGUE_STATES.CLOSED;
    if (this.onComplete) this.onComplete()
    this.onComplete = undefined
  }

  private updateButtons() {
    if (this.pageIndex === this.dialoguePages.length - 1) {
      this.controls.doneButton.setVisible(true);
      this.controls.skipButton.setVisible(false);
      this.controls.continueButton.setVisible(false);
    } else {
      this.controls.doneButton.setVisible(false);
      this.controls.skipButton.setVisible(true);
      this.controls.continueButton.setVisible(true);
    }
  }

  reset() {
    this.currentDialoguePage = null;
    this.title.setText("");
    this.text.setText("");
    this.lineIndex = 0;
    this.wordIndex = 0;
    this.state = DIALOGUE_STATES.EMPTY;
  }

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
    Object.values(this.controls).forEach((btn) => btn.reset());
  }

  setDialoguePages(entries: DialogueEntry[]) {
    this.dialoguePages = entries;
  }

  setDialogueImage(imageFrame: string) {
    this.sprite.setTexture("all-assets", imageFrame);
  }

  destroy() {
    this.scene.input.removeAllListeners();
    this.scene.time.removeAllEvents();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
