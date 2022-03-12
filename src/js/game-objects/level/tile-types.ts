enum TILE_TYPES {
  ENTRANCE = "ENTRANCE",
  EXIT = "EXIT",
  BLANK = "BLANK",
  ENEMY = "ENEMY",
  SCRAMBLE_ENEMY = "SCRAMBLE_ENEMY",
  SHIELD_CONTROL = "SHIELD_CONTROL",
  GOLD = "GOLD",
  SHOP = "SHOP",
  WALL = "WALL",
  KEY = "KEY",
  PLACEHOLDER_PICKUP = "PLACEHOLDER_PICKUP",
}

type DebugMap = { [T in TILE_TYPES]: string };
const tileTypeToDebugCharacter: DebugMap = {
  [TILE_TYPES.ENTRANCE]: "S",
  [TILE_TYPES.SHOP]: "s",
  [TILE_TYPES.ENEMY]: "e",
  [TILE_TYPES.KEY]: "K",
  [TILE_TYPES.SCRAMBLE_ENEMY]: "?",
  [TILE_TYPES.SHIELD_CONTROL]: "C",
  [TILE_TYPES.GOLD]: "g",
  [TILE_TYPES.WALL]: "W",
  [TILE_TYPES.EXIT]: "X",
  [TILE_TYPES.BLANK]: ".",
  [TILE_TYPES.PLACEHOLDER_PICKUP]: "!",
};

export { tileTypeToDebugCharacter };
export default TILE_TYPES;
