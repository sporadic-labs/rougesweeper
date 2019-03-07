export default class Player {
  constructor(scene, x, y) {
    this.sprite = scene.add.sprite(x, y, "assets", "player");
  }

  destroy() {
    this.sprite.destroy();
  }
}
