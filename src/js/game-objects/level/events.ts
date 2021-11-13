import EventEmitter from "../../helpers/event-emitter";
import Player from "../player";
import Door from "./door";
import Level from "./level";
import Tile from "./tile";

enum LEVEL_EVENTS {
  LEVEL_START = "LEVEL_START",
  TILE_OVER = "TILE_OVER",
  TILE_OUT = "TILE_OUT",
  TILE_SELECT_PRIMARY = "TILE_SELECT_PRIMARY",
  TILE_SELECT_SECONDARY = "TILE_SELECT_SECONDARY",
  EXIT_OVER = "EXIT_OVER",
  EXIT_OUT = "EXIT_OUT",
  EXIT_SELECT_PRIMARY = "EXIT_SELECT_PRIMARY",
  PLAYER_FINISHED_MOVE = "PLAYER_FINISHED_MOVE"
}

type LevelEmitter = EventEmitter<{
  [LEVEL_EVENTS.LEVEL_START]: Level;
  [LEVEL_EVENTS.EXIT_OUT]: Door;
  [LEVEL_EVENTS.EXIT_OVER]: Door;
  [LEVEL_EVENTS.EXIT_SELECT_PRIMARY]: Door;
  [LEVEL_EVENTS.TILE_OUT]: Tile;
  [LEVEL_EVENTS.TILE_OVER]: Tile;
  [LEVEL_EVENTS.TILE_SELECT_PRIMARY]: Tile;
  [LEVEL_EVENTS.TILE_SELECT_SECONDARY]: Tile;
  [LEVEL_EVENTS.PLAYER_FINISHED_MOVE]: Player;
}>;

export default LEVEL_EVENTS;
export { LevelEmitter };
