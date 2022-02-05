import Phaser, { Scene, GameObjects, Tweens, Input } from "phaser";
import TILE_TYPES from "./tile-types";
import EVENTS, { LevelEmitter } from "./events";
import FlipEffect from "../components/flip-effect";
import AttackAnimation from "../player/attack-animation";
import DEPTHS, { yPositionToDepth } from "../depths";
import createPickupAnimation from "./tile-animations/pickup-animation";
import createDisappearAnimation from "./tile-animations/disappear-animation";
import createAttackAnimation from "./tile-animations/attack-animation";
import { TileDialogueEntry } from "../hud/dialogue-manager";
import BezierEasing from "bezier-easing";
import TweenPoser from "../components/tween-poser";
import Level from "./level";

type FadePoses = "FadeOut" | "FadeIn";
type MagnifyPoses = "ZoomIn" | "ZoomOut";

export default class Tile {
  public isRevealed = false;
  public gridX = 0;
  public gridY = 0;
  public isCurrentlyBlank: boolean;
  public dialoguePlayedCounter = 0;
  private backSprite: GameObjects.Sprite;
  private frontSprite: GameObjects.Sprite;
  private scrambleSprite: GameObjects.Sprite;
  private tileContents?: GameObjects.Sprite;
  private container: GameObjects.Container;
  private flipEffect: FlipEffect;
  private tileGraphicTimeline?: Tweens.Timeline;
  private tileFadePoser: TweenPoser<FadePoses>;
  private tileMagnifyPoser: TweenPoser<MagnifyPoses>;
  private contentsMagnifyPoser: TweenPoser<MagnifyPoses>;
  private canScramble = false;

  constructor(
    private scene: Scene,
    private tileKey: string,
    public type: TILE_TYPES,
    private frameName: string,
    private x: number,
    private y: number,
    private level: Level,
    public isReachable: boolean,
    private dialogueData: TileDialogueEntry
  ) {
    this.isCurrentlyBlank = type === TILE_TYPES.BLANK;

    this.dialogueData = dialogueData;
    this.dialoguePlayedCounter = 0;

    this.gridX = 0;
    this.gridY = 0;

    this.frontSprite = scene.add.sprite(0, 0, "all-assets", tileKey);
    this.backSprite = scene.add.sprite(0, 0, "all-assets", "tile-back-disabled");

    this.scrambleSprite = scene.add.sprite(x, y, "all-assets", "scramble-1");
    this.scrambleSprite.setDepth(yPositionToDepth(y));
    this.scrambleSprite.setAlpha(0);
    this.scrambleSprite.setScale(1.25);

    // Add the front and back tile to a container for easy access.
    this.container = scene.add.container(x, y, [this.backSprite, this.frontSprite]);
    this.container.alpha = 0;
    this.container.setSize(this.backSprite.width, this.backSprite.height);
    this.container.setDepth(DEPTHS.BOARD);

    if (!this.isCurrentlyBlank && type !== TILE_TYPES.ENTRANCE) {
      this.tileContents = scene.add.sprite(x, y - 20, "all-assets", frameName);
      this.tileContents.setDepth(yPositionToDepth(y));
    }

    this.isRevealed = false;
    this.flipEffect = new FlipEffect(scene, this.frontSprite, this.backSprite);
    this.flipEffect.setToBack();
    this.tileContents?.setVisible(false);

    this.tileMagnifyPoser = new TweenPoser(scene, this.container, { duration: 100 });
    this.tileMagnifyPoser.definePoses({
      ZoomIn: { scaleX: 1.1, scaleY: 1.1 },
      ZoomOut: { scaleX: 1, scaleY: 1 },
    });

    this.contentsMagnifyPoser = new TweenPoser(scene, this.tileContents, {
      duration: 250,
      ease: BezierEasing(0.31, 0.68, 0.02, 1.47), // https://cubic-bezier.com/#.17,.67,.83,.67
    });
    this.contentsMagnifyPoser.definePoses({
      ZoomIn: { scaleX: 1.2, scaleY: 1.2 },
      ZoomOut: { scaleX: 0, scaleY: 0 },
    });
    this.contentsMagnifyPoser.setToPose("ZoomOut");

    this.tileFadePoser = new TweenPoser(scene, this.container, { duration: 100 });
    this.tileFadePoser.definePoses({
      FadeIn: { alpha: 1 },
      FadeOut: { alpha: 0.6 },
    });
    this.tileFadePoser.setToPose("FadeIn");
  }

  removeTileContents() {
    this.tileContents?.setVisible(false);
    this.isCurrentlyBlank = true;
  }

  playTileEffectAnimation(playerX: number, playerY: number) {
    return new Promise<void>((resolve) => {
      if (
        this.type === TILE_TYPES.GOLD ||
        this.type === TILE_TYPES.ENEMY ||
        this.type === TILE_TYPES.SCRAMBLE_ENEMY ||
        this.type === TILE_TYPES.KEY
      ) {
        if (!this.tileContents) return;
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
    return new Promise<void>((resolve) => {
      if (
        this.type === TILE_TYPES.GOLD ||
        this.type === TILE_TYPES.ENEMY ||
        this.type === TILE_TYPES.SCRAMBLE_ENEMY
      ) {
        if (!this.tileContents) return;
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
      this.tileFadePoser.moveToPose("FadeOut", {
        delay,
        duration,
        scaleX: 0.9,
        scaleY: 0.9,
        onComplete: resolve,
      });
    });
  }

  /**
   * Fade the tile in, and return a promise when it's done!
   */
  fadeTileIn(duration = Phaser.Math.Between(150, 300), delay = 0) {
    return new Promise<void>((resolve: () => void) => {
      this.tileFadePoser.moveToPose("FadeIn", {
        delay,
        duration,
        onComplete: resolve,
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

  getCanScramble(): boolean {
    return this.canScramble;
  }

  setCanScramble(canScramble: boolean): void {
    this.canScramble = canScramble;
    if (canScramble && this.isRevealed) this.scrambleSprite.setAlpha(1);
    else this.scrambleSprite.setAlpha(0);
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
    this.level.events.emit(event, this);
  };

  onHoverStart = () => {
    this.tileMagnifyPoser.moveToPose("ZoomIn");
    this.level.events.emit(EVENTS.TILE_OVER, this);
  };

  onHoverEnd = () => {
    this.tileMagnifyPoser.moveToPose("ZoomOut");
    this.level.events.emit(EVENTS.TILE_OUT, this);
  };

  async flipToFront(): Promise<void> {
    if (this.isRevealed) return;
    this.isRevealed = true;
    if (!this.isCurrentlyBlank && this.tileContents) {
      this.flipEffect.events.once("halfway", () => {
        this.tileContents.setVisible(true);
        this.contentsMagnifyPoser.moveToPose("ZoomIn");
      });
    }
    return new Promise((resolve) => {
      this.flipEffect.events.once("complete", () => {
        resolve();
        this.level.onTileFlip(this);
        if (this.canScramble) this.scrambleSprite.setAlpha(1);
      });
      this.flipEffect.flipToFront();
    });
  }

  async flipToBack(): Promise<void> {
    if (!this.isRevealed) return;
    this.isRevealed = false;
    this.tileContents?.setVisible(false);
    return new Promise((resolve) => {
      this.flipEffect.events.once("complete", () => {
        resolve();
        this.level.onTileFlip(this);
      });
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
    if (!this.isRevealed) {
      setTimeout(() => {
        this.backSprite.setFrame("tile-back");
      }, 100);
    }
  };

  unhighlight = () => {
    this.backSprite.setFrame("tile-back-disabled");
  };

  getDialogueData() {
    return this.dialogueData;
  }

  destroy() {
    this.tileMagnifyPoser.destroy();
    this.scrambleSprite.destroy();
    this.tileFadePoser.destroy();
    this.contentsMagnifyPoser.destroy();
    this.container.destroy();
    this.tileContents?.destroy();
    this.disableInteractive();
    if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();
  }
}
