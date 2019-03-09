import TILE_TYPES from "./tile-types";
import LEVEL_EVENTS from "./events";
import FlipEffect from "./flip-effect";

const TYPE_TO_KEY = {
  [TILE_TYPES.BLANK]: "tile-blank",
  [TILE_TYPES.GOLD]: "tile-gold",
  [TILE_TYPES.ENEMY]: "tile-enemy",
  [TILE_TYPES.EXIT]: "tile-exit"
};

export default class Tile {
  /** @param {Phaser.Scene} scene */
  constructor(scene, type, x, y, levelEvents) {
    this.scene = scene;
    this.levelEvents = levelEvents;
    this.type = type;

    this.gridX = 0;
    this.gridY = 0;

    this.backSprite = scene.add.sprite(0, 0, "assets", `tiles/tile-back`);
    this.frontSprite = scene.add.sprite(0, 0, "assets", `tiles/${TYPE_TO_KEY[type]}`);
    this.container = scene.add.container(x, y, [this.backSprite, this.frontSprite]);

    this.flipEffect = new FlipEffect(scene, this.frontSprite, this.backSprite);
    this.flipEffect.setToBack();

    this.container.setSize(this.backSprite.width, this.backSprite.height);
  }

  isRevealed() {
    return this.flipEffect.flipProgress === 1;
  }

  setGridPosition(x, y) {
    this.gridX = x;
    this.gridY = y;
  }

  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }

  enableInteractive() {
    this.container.setInteractive();
    this.container.on("pointerover", this.onHoverStart);
    this.container.on("pointerout", this.onHoverEnd);
    this.container.on("pointerdown", this.onPointerDown);
  }

  disableInteractive() {
    this.container.disableInteractive();
    this.container.off("pointerover", this.onHoverStart);
    this.container.off("pointerout", this.onHoverEnd);
    this.container.off("pointerdown", this.onPointerDown);
  }

  onPointerDown = () => {
    this.levelEvents.emit(LEVEL_EVENTS.TILE_SELECT, this);
  };

  onHoverStart = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.container,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100
    });
    this.levelEvents.emit(LEVEL_EVENTS.TILE_OUT, this);
  };

  onHoverEnd = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.container,
      scaleX: 1,
      scaleY: 1,
      duration: 100
    });
    this.levelEvents.emit(LEVEL_EVENTS.TILE_OUT, this);
  };

  flipToFront() {
    return new Promise(resolve => {
      this.flipEffect.events.once("complete", resolve);
      this.flipEffect.flipToFront();
    });
  }

  flipToBack() {
    return new Promise(resolve => {
      this.flipEffect.events.once("complete", resolve);
      this.flipEffect.flipToBack();
    });
  }

  getPosition() {
    return { x: this.container.x, y: this.container.y };
  }
}
