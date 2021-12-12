/**
 * Object that maps out a few z-sorting layers to help centralize the placement of game objects on
 * top of one another. Phaser uses a simple integer to indicate where GOs go. When two GOs have
 * the same z-depth, the more recently added GO is drawn on top.
 */
const DEPTHS = {
  GROUND: 0,
  BOARD: 100,
  ABOVE_GROUND: 101,
  BELOW_PLAYER: 300,
  PLAYER: 400,
  ABOVE_PLAYER: 500,
  HUD: 600,
  DIALOGUE: 700,
  MENU: 800,
};

/**
 * Convert a y world position on the map to a z-sorted depth so that higher y values will be on top
 * of lower y values.
 * @param yPosition
 */
function yPositionToDepth(yPosition: number) {
  return DEPTHS.BOARD + yPosition / 75;
}

export default DEPTHS;
export { yPositionToDepth };
