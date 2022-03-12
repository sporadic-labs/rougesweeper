import EventEmitter from "../../helpers/event-emitter";
import Door from "../level/door";
import Level from "../level/level";
import Player from "../player";

enum GAME_EVENTS {
  // Fired right before idle flow starts
  LEVEL_START = "LEVEL_START",
  // Fired after clicking on the exit door and moving to it
  EXIT_SELECT = "EXIT_SELECT",
  // Fired after clicking on the exit door
  PLAYER_FINISHED_MOVE = "PLAYER_FINISHED_MOVE",
}

type GameEmitter = EventEmitter<{
  [GAME_EVENTS.LEVEL_START]: Level;
  [GAME_EVENTS.EXIT_SELECT]: Door;
  [GAME_EVENTS.PLAYER_FINISHED_MOVE]: Player;
}>;

const makeGameEmitter = () => new EventEmitter() as GameEmitter;

export { GameEmitter, GAME_EVENTS, makeGameEmitter };
