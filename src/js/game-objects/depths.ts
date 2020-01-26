/**
 * Object that maps out a few z-sorting layers to help centralize the placement of game objects on
 * top of one another. Phaser uses a simple integer to indicate where GOs go. When two GOs have
 * the same z-depth, the more recently added GO is drawn on top.
 */
const DEPTHS = {
  GROUND: 0,
  BOARD: 50,
  ABOVE_GROUND: 100,
  PLAYER: 200,
  ABOVE_PLAYER: 300,
  HUD: 400,
  DIALOGUE: 500,
  MENU: 600
};

export default DEPTHS;
