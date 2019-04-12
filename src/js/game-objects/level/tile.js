import TILE_TYPES from "./tile-types";
import LEVEL_EVENTS from "./events";
import FlipEffect from "./flip-effect";
import AttackAnimation from "../player/attack-animation";

const TYPE_TO_KEY = {
  [TILE_TYPES.START]: "tile-blank",
  [TILE_TYPES.SHOP]: "shop",
  [TILE_TYPES.BLANK]: "tile-blank",
  [TILE_TYPES.GOLD]: "gold",
  [TILE_TYPES.ENEMY]: "enemy",
  [TILE_TYPES.EXIT]: "exit-down",
  [TILE_TYPES.WALL]: "wall"
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

    // Construct the Front Tile based on it's type.
    // It always gets a background title, with an optional top graphic.
    const frontTileSprites = [scene.add.sprite(0, 0, "assets", "tiles/tile-blank")];
    if (type !== TILE_TYPES.BLANK) {
      frontTileSprites.push(scene.add.sprite(0, 0, "assets", `tiles/${TYPE_TO_KEY[type]}`));
    }
    this.frontTile = scene.add.container(0, 0, frontTileSprites);

    // Add the front and back tile to a container for easy access.
    this.container = scene.add.container(x, y, [this.backSprite, this.frontTile]);

    this.flipEffect = new FlipEffect(scene, this.frontTile, this.backSprite);
    this.flipEffect.setToBack();

    this.container.setSize(this.backSprite.width, this.backSprite.height);
  }

  isRevealed() {
    return this.flipEffect.flipProgress === 1;
  }

  playTileEffectAnimation(playerX, playerY) {
    return new Promise(resolve => {
      if (this.type === TILE_TYPES.GOLD || this.type === TILE_TYPES.ENEMY) {
        if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();

        this.tileGraphicTimeline = this.scene.tweens.createTimeline();

        const tileGraphic = this.frontTile.getAt(1);

        // Setup different animations for the Gold vs. the Enemy graphics.
        if (this.type === TILE_TYPES.GOLD) {
          this.tileGraphicTimeline
            .add({
              targets: tileGraphic,
              ease: Phaser.Math.Easing.Quadratic.Out,
              duration: 200,
              scaleX: 1.05,
              scaleY: 1.05,
              y: -30
            })
            .add({
              targets: tileGraphic,
              duration: 200,
              ease: Phaser.Math.Easing.Quadratic.In,
              scaleX: 0.5,
              scaleY: 0.5,
              y: 0
            });
        } else if (this.type === TILE_TYPES.ENEMY) {
          this.tileGraphicTimeline
            .add({
              targets: tileGraphic,
              ease: Phaser.Math.Easing.Quadratic.InOut,
              duration: 200,
              x: 10,
              angle: 5
            })
            .add({
              targets: tileGraphic,
              duration: 150,
              ease: Phaser.Math.Easing.Quadratic.In,
              x: -10,
              angle: -10
            })
            .add({
              targets: tileGraphic,
              duration: 150,
              ease: Phaser.Math.Easing.Quadratic.Out,
              scaleX: 0.5,
              scaleY: 0.5,
              x: 0,
              angle: 0,
              complete: () => {
                const attackAnim = new AttackAnimation(
                  this.scene,
                  "enemy-attack",
                  playerX - 40,
                  playerY - 28
                );
                attackAnim.fadeout().then(() => attackAnim.destroy());
              }
            });
        }

        this.tileGraphicTimeline
          .on("complete", () => {
            tileGraphic.destroy();
            // Convert this tile to a blank to prevent player interaction.
            this.type = TILE_TYPES.BLANK;
            return resolve();
          })
          .play();
      } else {
        resolve();
      }
    });
  }

  playTileDestructionAnimation() {
    return new Promise(resolve => {
      if (this.type === TILE_TYPES.GOLD || this.type === TILE_TYPES.ENEMY) {
        if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();

        this.tileGraphicTimeline = this.scene.tweens.createTimeline();

        const tileGraphic = this.frontTile.getAt(1);

        this.tileGraphicTimeline
          .add({
            targets: tileGraphic,
            duration: 400,
            ease: Phaser.Math.Easing.Quadratic.In,
            scaleX: 0.25,
            scaleY: 0.25,
            angle: 720
          })
          .on("complete", () => {
            tileGraphic.destroy();
            // Convert this tile to a blank to prevent player interaction.
            this.type = TILE_TYPES.BLANK;
            return resolve();
          })
          .play();
      } else {
        resolve();
      }
    });
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

  highlight = () => {
    if (this.fadeTween) this.fadeTween.stop();
    this.fadeTween = this.scene.add.tween({
      targets: this.container,
      alpha: 1,
      duration: 100
    });
  };

  unhighlight = () => {
    if (this.fadeTween) this.fadeTween.stop();
    this.fadeTween = this.scene.add.tween({
      targets: this.container,
      alpha: 0.6,
      duration: 100
    });
  };

  destroy() {
    this.disableInteractive();
    if (this.tween) this.tween.stop();
    if (this.fadeTween) this.fadeTween.stop();
    if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();
    this.scene = undefined;
    this.container.destroy();
  }
}
