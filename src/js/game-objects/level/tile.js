import TILE_TYPES from "./tile-types";

const TYPE_TO_KEY = {
  [TILE_TYPES.BLANK]: "tile-blank",
  [TILE_TYPES.GOLD]: "tile-gold",
  [TILE_TYPES.ENEMY]: "tile-enemy",
  [TILE_TYPES.EXIT]: "tile-exit"
};

export default class Tile {
  /** @param {Phaser.Scene} scene */
  constructor(scene, type, x, y) {
    this.backSprite = scene.add.sprite(0, 0, "assets", `tiles/tile-back`);
    this.frontSprite = scene.add.sprite(0, 0, "assets", `tiles/${TYPE_TO_KEY[type]}`);
    this.container = scene.add.container(x, y, [this.backSprite, this.frontSprite]);
    this.frontSprite.setVisible(false);
    this.isFrontVisible = false;

    // TESTING
    this.container.setSize(this.backSprite.width, this.backSprite.height);
    this.container.setInteractive();
    this.container.on("pointerover", this.flipToFront);
    this.container.on("pointerout", this.flipToBack);
  }

  flipToFront = () => {
    this.isFrontVisible = true;
    this.backSprite.setVisible(!this.isFrontVisible);
    this.frontSprite.setVisible(this.isFrontVisible);
  };

  flipToBack = () => {
    this.isFrontVisible = false;
    this.backSprite.setVisible(!this.isFrontVisible);
    this.frontSprite.setVisible(this.isFrontVisible);
  };
}
