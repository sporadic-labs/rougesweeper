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
  PICKUP = "PICKUP",
  COMPASS = "COMPASS",
  EMP = "EMP",
  SNIPER = "SNIPER",
  ALERT_AMMO = "ALERT_AMMO",
}

export const isEnemyTile = (tile: TILE_TYPES) =>
  [TILE_TYPES.SCRAMBLE_ENEMY, TILE_TYPES.ENEMY].includes(tile);

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
  [TILE_TYPES.PICKUP]: "8",
  [TILE_TYPES.COMPASS]: "8",
  [TILE_TYPES.EMP]: "8",
  [TILE_TYPES.SNIPER]: "8",
  [TILE_TYPES.ALERT_AMMO]: "8",
};

export { tileTypeToDebugCharacter };
export default TILE_TYPES;
