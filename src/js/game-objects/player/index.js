export default class Player {
  /** @param {Phaser.Scene} scene */
  constructor(scene, x, y) {
    this.sprite = scene.add
      .sprite(x, y, "assets", "player")
      .setScale(1.25, 1.25)
      .setDepth(10);

    this.gridX = 0;
    this.gridY = 0;

    this.playerHealth = 3;
    this.purse = 0;
  }

  setPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }

  addHealth() {
    if (this.playerHealth < 3) {
      this.playerHealth++;
      console.log(`New Player health: ${this.playerHealth}`);
    } else {
      console.log(`Max health: ${this.playerHealth}!`);
    }
  }

  removeHealth() {
    if (this.playerHealth <= 1) {
      this.playerHealth = 0;
      console.log("Game Over, Man!");
      // TODO(rex): Actually end the game...
    } else if (this.playerHealth > 1) {
      this.playerHealth--;
      console.log(`New Player health: ${this.playerHealth}!`);
    }
  }

  addGold() {
    this.purse++;
    console.log(`Purse: ${this.purse} gold!`);
  }

  removeGold() {
    if (this.purse > 0) {
      this.purse--;
    }
    console.log(`Purse: ${this.purse} gold!`);
  }

  destroy() {
    this.sprite.destroy();
  }
}
