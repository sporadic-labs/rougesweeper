export default class GameManager {
  constructor(scene, player, level) {
    this.scene = scene;

    const playerPosition = level.getStartingPosition();
    player.setPosition(playerPosition.x, playerPosition.y);
  }
}
