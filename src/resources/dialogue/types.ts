import { Scene } from "phaser";
import DialogueManager from "../../js/game-objects/hud/dialogue-manager";
import Tile from "../../js/game-objects/level/tile";
import { GameStore } from "../../js/store/index";

export interface DialogueCondition {
  (dialogueManager: DialogueManager, tile: Tile, store: GameStore, scene: Scene): boolean;
}

export interface DialogueEntry {
  title: string;
  imageKey: string;
  text: string[];
}

export interface DialogueData {
  level: string;
  position: { x: number; y: number };
  repeat: false | number;
  condition: null | DialogueCondition;
  entries: DialogueEntry[];
}
