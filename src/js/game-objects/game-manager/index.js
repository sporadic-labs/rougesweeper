import LEVEL_EVENTS from "../level/events";

export default class GameManager {
  constructor(scene, player, level) {
    this.scene = scene;
    this.level = level;

    const worldPos = level.getStartingWorldPosition();
    player.setPosition(worldPos.x, worldPos.y);

    this.startMoveFlow();
  }

  startMoveFlow() {
    this.level.events.on(LEVEL_EVENTS.TILE_SELECT, tile =>
      // If tile is in range of player
      //  disable tile interactivity
      //  reveal tile
      //  apply tile effect
      //  move player
      //  re-enable tile interactivity
      console.log(`Moving to tile ${tile.type.toString()}`)
    );
  }
}
