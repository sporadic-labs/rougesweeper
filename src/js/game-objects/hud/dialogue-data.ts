/*
 * Dialogue Data for a tile, generated from static Markdown files.
 */

import Tile from "../level/tile";

export interface TileDialogueEntry {
  level: string;
  x: number;
  y: number;
  entries: DialogueEntry[];
  repeat: boolean;
  condition: () => boolean;
}

export interface DialogueEntry {
  title: string;
  imageKey: string;
  text: string[];
}

// TODO(rex): Move this data to a markdown file.
const lvl_1_floor_1_2_2: TileDialogueEntry = {
  level: "level-1-floor-1",
  x: 2,
  y: 2,
  repeat: true,
  condition: null,
  entries: [
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
  ]
};

const lvl_1_floor_2_1_2: TileDialogueEntry = {
  level: "level-1-floor-2",
  x: 1,
  y: 2,
  repeat: true,
  condition: null,
  entries: [
    {
      title: "Frodo",
      imageKey: "",
      text: ["If you ask it of me, I will give you the One Ring."]
    },
    {
      title: "Galadriel",
      imageKey: "",
      text: ["You offer it to me freely.", "I do not deny that my heart has greatly desired this."]
    },
    {
      title: "Galadriel",
      imageKey: "",
      text: [
        "In place OF A DARK LORD, YOU WILL HAVE A QUEEN!",
        "NOT DARK BUT BEAUTIFUL AND TERRIBLE AS THE DAWN!",
        "TREACHEROUS AS THE SEA! STRONGER THAN THE FOUNDATIONS OF THE EARTH!",
        "ALL SHALL LOVE ME AND DISPAIR!"
      ]
    }
  ]
};

const lvl_1_floor_3_2_3: TileDialogueEntry = {
  level: "level-1-floor-3",
  x: 2,
  y: 3,
  repeat: true,
  condition: null,
  entries: [
    {
      title: "Boromir",
      imageKey: "",
      text: [
        "Leave it! It is over.",
        "The world of men will fall, and all will come to darkness… and my city to ruin."
      ]
    },
    {
      title: "Aragorn",
      imageKey: "",
      text: [
        "I do not know what strength is in my blood, but I swear to you I will not let the white city fall, nor our people fail!"
      ]
    },
    {
      title: "Boromir",
      imageKey: "",
      text: ["Our people?", "Our people."]
    },
    {
      title: "Boromir",
      imageKey: "",
      text: ["I would have followed you my brother...", "...my captain...", "...my king!"]
    }
  ]
};

export default class DialogueData {
  data: TileDialogueEntry[];

  /** */
  constructor() {
    this.loadData();
  }

  loadData() {
    // TODO(rex): Load data from markdown files.
    this.data = [lvl_1_floor_1_2_2, lvl_1_floor_2_1_2, lvl_1_floor_3_2_3];
  }

  getDialogueDataForTile(tile: Tile) {
    const tileEntry = this.data.find(
      entry => entry.x === tile.gridX && entry.y === tile.gridY && entry.level === tile.levelKey
    );
    if (tileEntry) return tileEntry;
    else return null;
  }
}
