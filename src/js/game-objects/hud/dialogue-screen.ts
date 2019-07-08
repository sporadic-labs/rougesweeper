/*
 * Dialogue Screen.
 */
import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/events";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import { levelKeys } from "../../store/levels";

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

interface DialogEntry {
  title: string;
  imageKey: string;
  text: string[];
}

const testPages: DialogEntry[] = [
  {
    title: "Elrond",
    imageKey: "",
    text: [
      "Strangers from distant lands, friends of old.",
      "You have been summoned here to answer the threat of Mordor.",
      "Middle-Earth stands upon the brink of destruction.",
      "None can escape it."
    ]
  },
  {
    title: "Elrond",
    imageKey: "",
    text: [
      "You will unite or you will fall. Each race is bound to this fate--this one doom.",
      "Bring forth the Ring, Frodo."
    ]
  },
  {
    title: "Boromir",
    imageKey: "",
    text: ["So it is true..."]
  },
  {
    title: "Man of Laketown",
    imageKey: "",
    text: ["The Doom of Men!"]
  },
  {
    title: "Borimir",
    imageKey: "",
    text: [
      "It is a gift.",
      "A gift to the foes of Mordor.",
      "Why not use this Ring? Long has my father, the Steward of Gondor, kept the forces of Mordor at bay."
    ]
  },
  {
    title: "Borimir",
    imageKey: "",
    text: [
      "By the blood of our people are your lands kept safe!",
      "Give Gondor the weapon of the enemy.",
      "Let us use it against him!"
    ]
  },
  {
    title: "Aragorn",
    imageKey: "",
    text: [
      "You cannot wield it! None of us can. The One Ring answers to Sauron alone.",
      "It has no other master."
    ]
  },
  {
    title: "Borimir",
    imageKey: "",
    text: ["And what would a ranger know of this matter?"]
  },
  {
    title: "Legolas",
    imageKey: "",
    text: [
      "This is no mere ranger.",
      "He is Aragorn, son of Arathorn.",
      "You owe him your allegiance."
    ]
  },
  {
    title: "Borimir",
    imageKey: "",
    text: ["Aragorn? This... is Isildur's heir?"]
  }
];

enum DIALOG_STATES {
  EMPTY = "EMPTY",
  WRITING = "WRITING",
  OPEN = "OPEN",
  CLOSED = "CLOSED"
}

export default class DialogScreen {
  private scene: Phaser.Scene;
  private gameStore: GameStore;
  private skipButton: TextButton;
  private proxy: EventProxy;
  private container: Phaser.GameObjects.Container;
  private previousGameState: GAME_MODES;
  private isOpen: boolean = false;

  private state: DIALOG_STATES = DIALOG_STATES.CLOSED;

  private dialoguePages: DialogEntry[] = testPages;
  private currentDialoguePage: DialogEntry = {
    title: "Default",
    imageKey: "",
    text: []
  };

  private line: string[] = [];

  private wordIndex: number = 0;
  private lineIndex: number = 0;
  private pageIndex: number = 0;

  private wordDelay: number = 96;
  private lineDelay: number = 184;
  private pageDelay: number = 256;

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

  nextState() {
    switch (this.state) {
      case DIALOG_STATES.EMPTY:
        this.nextLine();
        break;
      case DIALOG_STATES.WRITING:
        this.completeText();
        break;
      case DIALOG_STATES.CLOSED:
        this.open();
        break;
      case DIALOG_STATES.OPEN:
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
    this.state = DIALOG_STATES.WRITING;

    // If we're at the end, bail.
    if (this.lineIndex === this.currentDialoguePage.text.length) {
      this.state = DIALOG_STATES.OPEN;
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
    this.resetTextContent();
    this.pageIndex++;
    this.getTextContent();
    this.nextState();
  }

  completeText() {
    this.state = DIALOG_STATES.OPEN;
    this.scene.time.removeAllEvents();
    // TODO(rex): Do this for real?
    const text = this.currentDialoguePage.text.join("\n");
    this.text.setText(text);
  }

  open() {
    this.state = DIALOG_STATES.OPEN;
    this.isOpen = true;
    this.getTextContent();
    this.container.setVisible(true);
    this.nextLine();
    this.previousGameState = this.gameStore.gameState;
  }

  close() {
    this.isOpen = false;
    this.container.setVisible(false);
    this.resetTextContent();
    this.pageIndex = 0;
    this.scene.time.removeAllEvents();
    this.gameStore.setGameState(this.previousGameState);
    this.state = DIALOG_STATES.CLOSED;
  }

  getTextContent() {
    this.currentDialoguePage = this.dialoguePages[this.pageIndex];
    this.title.setText(this.currentDialoguePage.title);
  }

  resetTextContent() {
    this.currentDialoguePage = {
      title: "Default",
      imageKey: "",
      text: []
    };
    this.title.setText("");
    this.text.setText("");
    this.lineIndex = 0;
    this.wordIndex = 0;
    this.state = DIALOG_STATES.EMPTY;
  }

  resetButtons() {
    // Manually call this when closing menu because of bug where button stays in pressed state
  }

  destroy() {
    this.scene.input.removeAllListeners();
    this.scene.time.removeAllEvents();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
