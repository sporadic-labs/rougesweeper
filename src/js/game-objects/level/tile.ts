import Phaser, { Scene, Events, GameObjects, Tweens, Input } from "phaser";
import TILE_TYPES from "./tile-types";
import EVENTS from "./events";
import FlipEffect from "../components/flip-effect";
import AttackAnimation from "../player/attack-animation";
import DEPTHS from "../depths";
import createPickupAnimation from "./tile-animations/pickup-animation";
import createDisappearAnimation from "./tile-animations/disappear-animation";
import createAttackAnimation from "./tile-animations/attack-animation";
import { MagnifyEffect } from "../components/magnify-effect";
import FadeEffect from "../components/fade-effect";
import { TileDialogueEntry } from "../hud/dialogue-manager";

export default class Tile {
  public isRevealed = false;
  public gridX = 0;
  public gridY = 0;
  public isCurrentlyBlank: boolean;
  public dialoguePlayedCounter = 0;
  private backSprite: GameObjects.Sprite;
  private tileContents: GameObjects.Sprite;
  private frontTile: GameObjects.Container;
  private container: GameObjects.Container;
  private flipEffect: FlipEffect;
  private magnifyEffect: MagnifyEffect;
  private fadeEffect: FadeEffect;
  private tileGraphicTimeline: Tweens.Timeline;

  constructor(
    private scene: Scene,
    private tileKey: string,
    public type: TILE_TYPES,
    private frameName: string,
    private x: number,
    private y: number,
    private levelEvents: Events.EventEmitter,
    private dialogueData: TileDialogueEntry
  ) {
    this.isCurrentlyBlank = type === TILE_TYPES.BLANK;

    this.dialogueData = dialogueData;
    this.dialoguePlayedCounter = 0;

    this.gridX = 0;
    this.gridY = 0;

    this.backSprite = scene.add.sprite(0, 0, "all-assets", "tile-back");

    const frontTileSprites = [scene.add.sprite(0, 0, "all-assets", tileKey)];
    this.tileContents = null;
    if (!this.isCurrentlyBlank && type !== TILE_TYPES.ENTRANCE) {
      this.tileContents = scene.add.sprite(0, -20, "all-assets", frameName);
      frontTileSprites.push(this.tileContents);
    }
    this.frontTile = scene.add.container(0, 0, frontTileSprites);

    // Add the front and back tile to a container for easy access.
    this.container = scene.add.container(x, y, [this.backSprite, this.frontTile]);

    this.container.alpha = 0;

    this.isRevealed = false;
    this.flipEffect = new FlipEffect(scene, this.frontTile, this.backSprite);
    this.flipEffect.setToBack();

    this.magnifyEffect = new MagnifyEffect(scene, this.container, 1, 1.1, 100);
    this.fadeEffect = new FadeEffect(scene, this.container, 1, 0.6, 100);

    this.container.setSize(this.backSprite.width, this.backSprite.height);
    console.log(y);
    this.container.setDepth(DEPTHS.BOARD);
  }

  removeTileContents() {
    this.tileContents.setVisible(false);
    this.isCurrentlyBlank = true;
  }

  playTileEffectAnimation(playerX: number, playerY: number) {
    return new Promise(resolve => {
      if (
        this.type === TILE_TYPES.GOLD ||
        this.type === TILE_TYPES.ENEMY ||
        this.type === TILE_TYPES.SCRAMBLE_ENEMY ||
        this.type === TILE_TYPES.KEY
      ) {
        if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();

        this.tileGraphicTimeline = this.scene.tweens.createTimeline();

        // Setup different animations for the Gold vs. the Enemy graphics.
        if (this.type === TILE_TYPES.GOLD || this.type === TILE_TYPES.KEY) {
          this.tileGraphicTimeline = createPickupAnimation(this.scene, this.tileContents);
        } else if (this.type === TILE_TYPES.ENEMY || this.type === TILE_TYPES.SCRAMBLE_ENEMY) {
          this.tileGraphicTimeline = createAttackAnimation(this.scene, this.tileContents);
          this.tileGraphicTimeline.on("complete", () => {
            const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(4, 5)}`;
            const attackAnim = new AttackAnimation(
              this.scene,
              attackAnimKey,
              playerX - 40,
              playerY - 28
            );
            attackAnim.fadeout().then(() => attackAnim.destroy());
          });
        }

        this.tileGraphicTimeline.on("complete", () => {
          this.removeTileContents();
          return resolve();
        });
        this.tileGraphicTimeline.play();
      } else {
        resolve();
      }
    });
  }

  playTileDestructionAnimation() {
    return new Promise(resolve => {
      if (
        this.type === TILE_TYPES.GOLD ||
        this.type === TILE_TYPES.ENEMY ||
        this.type === TILE_TYPES.SCRAMBLE_ENEMY
      ) {
        if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();
        this.tileGraphicTimeline = createDisappearAnimation(this.scene, this.tileContents);
        this.tileGraphicTimeline
          .on("complete", () => {
            this.removeTileContents();
            return resolve();
          })
          .play();
      } else {
        resolve();
      }
    });
  }

  /**
   * Fade the tile out, destroy it, and resolve a promise when the whole mess is done!
   */
  fadeTileOut(duration = Phaser.Math.Between(150, 300), delay = 0) {
    return new Promise<void>((resolve: () => void) => {
      this.fadeEffect.fadeOut({
        delay,
        alpha: 0,
        scaleX: 0.9,
        scaleY: 0.9,
        duration,
        onComplete: resolve
      });
    });
  }

  /**
   * Fade the tile in, and return a promise when it's done!
   */
  fadeTileIn(duration = Phaser.Math.Between(150, 300), delay = 0) {
    return new Promise<void>((resolve: () => void) => {
      this.fadeEffect.fadeIn({
        delay,
        alpha: 0.6,
        duration,
        onComplete: resolve
      });
    });
  }

  /**
   * Set the position of the tile based on the Map Grid.
   */
  setGridPosition(x: number, y: number) {
    this.gridX = x;
    this.gridY = y;
  }

  /**
   * Get the position of the tile in the Map Grid.
   */
  getGridPosition() {
    return { x: this.gridX, y: this.gridY };
  }

  /**
   * Enable user interactivity for the tile.
   */
  enableInteractive() {
    this.container.setInteractive();
    this.container.on("pointerover", this.onHoverStart);
    this.container.on("pointerout", this.onHoverEnd);
    this.container.on("pointerdown", this.onPointerDown);
  }

  /**
   * Disable user interactivity for the tile.
   */
  disableInteractive() {
    /* NOTE(rex): This handles the edge case of onHoverEnd never triggering,
     * since the gameManager disables interactivity when the move action kicks off.
     */
    this.onHoverEnd();
    this.container.disableInteractive();
    this.container.off("pointerover", this.onHoverStart);
    this.container.off("pointerout", this.onHoverEnd);
    this.container.off("pointerdown", this.onPointerDown);
  }

  onPointerDown = (pointer: Input.Pointer) => {
    const event = pointer.primaryDown ? EVENTS.TILE_SELECT_PRIMARY : EVENTS.TILE_SELECT_SECONDARY;
    this.levelEvents.emit(event, this);
  };

  onHoverStart = () => {
    this.magnifyEffect.scaleUp();
    this.levelEvents.emit(EVENTS.TILE_OVER, this);
  };

  onHoverEnd = () => {
    this.magnifyEffect.scaleDown();
    this.levelEvents.emit(EVENTS.TILE_OUT, this);
  };

  flipToFront() {
    this.isRevealed = true;
    return new Promise(resolve => {
      this.flipEffect.events.once("complete", resolve);
      this.flipEffect.flipToFront();
    });
  }

  flipToBack() {
    this.isRevealed = false;
    return new Promise(resolve => {
      this.flipEffect.events.once("complete", resolve);
      this.flipEffect.flipToBack();
    });
  }

  getPosition() {
    return { x: this.container.x, y: this.container.y };
  }

  /**
   * Returns the world bounds of the tile as a rect.
   */
  getBounds(rect = new Phaser.Geom.Rectangle()) {
    const { x, y, displayWidth, displayHeight } = this.container;
    rect.setTo(x - displayWidth / 2, y - displayHeight / 2, displayWidth, displayHeight);
    return rect;
  }

  highlight = () => {
    this.fadeEffect.fadeIn();
  };

  unhighlight = () => {
    this.fadeEffect.fadeOut();
  };

  getDialogueData() {
    return this.dialogueData;
  }

  destroy() {
    this.disableInteractive();
    this.magnifyEffect.destroy();
    this.fadeEffect.destroy();
    if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();
    this.scene = undefined;
    this.container.destroy();
  }
}
