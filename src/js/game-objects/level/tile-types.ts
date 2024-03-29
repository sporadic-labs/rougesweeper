enum TILE_TYPES {
  ENTRANCE = "ENTRANCE",
  EXIT = "EXIT",
  BLANK = "BLANK",
  ENEMY = "ENEMY",
  SCRAMBLE_ENEMY = "SCRAMBLE_ENEMY",
  SUPER_ENEMY = "SUPER_ENEMY",
  BOSS = "BOSS",
  GOLD = "GOLD",
  WALL = "WALL",
  KEY = "KEY",
  PICKUP = "PICKUP",
  COMPASS = "COMPASS",
  EMP = "EMP",
  SNIPER = "SNIPER",
  AMMO = "AMMO",
  UPGRADE = "UPGRADE",
  ALERT = "ALERT",
  WEAPON = "WEAPON",
}

export const isEnemyTile = (tile: TILE_TYPES) =>
  [TILE_TYPES.SCRAMBLE_ENEMY, TILE_TYPES.ENEMY, TILE_TYPES.SUPER_ENEMY, TILE_TYPES.BOSS].includes(
    tile
  );

export const isPickup = (tile: TILE_TYPES) =>
  [
    TILE_TYPES.PICKUP,
    TILE_TYPES.COMPASS,
    TILE_TYPES.EMP,
    TILE_TYPES.SNIPER,
    TILE_TYPES.AMMO,
    TILE_TYPES.UPGRADE,
    TILE_TYPES.ALERT,
    TILE_TYPES.WEAPON,
  ].includes(tile);

type DebugMap = { [T in TILE_TYPES]: string };
const tileTypeToDebugCharacter: DebugMap = {
  [TILE_TYPES.ENTRANCE]: "S",
  [TILE_TYPES.ENEMY]: "e",
  [TILE_TYPES.KEY]: "K",
  [TILE_TYPES.SCRAMBLE_ENEMY]: "?",
  [TILE_TYPES.SUPER_ENEMY]: "E",
  [TILE_TYPES.BOSS]: "B",
  [TILE_TYPES.GOLD]: "g",
  [TILE_TYPES.WALL]: "W",
  [TILE_TYPES.EXIT]: "X",
  [TILE_TYPES.BLANK]: ".",
  [TILE_TYPES.PICKUP]: "8",
  [TILE_TYPES.COMPASS]: "8",
  [TILE_TYPES.EMP]: "8",
  [TILE_TYPES.SNIPER]: "8",
  [TILE_TYPES.AMMO]: "8",
  [TILE_TYPES.UPGRADE]: "8",
  [TILE_TYPES.ALERT]: "8",
  [TILE_TYPES.WEAPON]: "H",
};

export { tileTypeToDebugCharacter };
export default TILE_TYPES;
