import Phaser, { Scene, GameObjects, Tweens, Input, Sound } from "phaser";
import TILE_TYPES, { isEnemyTile, isPickup } from "./tile-types";
import EVENTS from "./events";
import FlipEffect from "../components/flip-effect";
import AttackAnimation from "../player/attack-animation";
import DEPTHS, { yPositionToDepth } from "../depths";
import createPickupAnimation from "./tile-animations/pickup-animation";
import createDisappearAnimation from "./tile-animations/disappear-animation";
import createAttackAnimation from "./tile-animations/attack-animation";
import BezierEasing from "bezier-easing";
import TweenPoser from "../components/tween-poser";
import Level from "./level";
import { AUDIO_KEYS } from "../../scenes/index";
import SoundManager from "../sound-manager";

type FadePoses = "FadeOut" | "FadeIn";
type MagnifyPoses = "ZoomIn" | "ZoomOut";

export default class Tile {
  public isRevealed = false;
  public gridX = 0;
  public gridY = 0;
  public isCurrentlyBlank: boolean;
  public isScrambled = false;
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
  private scramblePoser: TweenPoser<FadePoses>;
  private secondarySelectKey: Input.Keyboard.Key;

  constructor(
    private scene: Scene,
    private tileKey: string,
    public type: TILE_TYPES,
    private frameName: string,
    private x: number,
    private y: number,
    private level: Level,
    public isReachable: boolean,
    private sound: SoundManager
  ) {
    this.isCurrentlyBlank = type === TILE_TYPES.BLANK;

    this.gridX = 0;
    this.gridY = 0;

    this.frontSprite = scene.add.sprite(0, 0, "all-assets", tileKey);
    this.backSprite = scene.add.sprite(0, 0, "all-assets", "tile-back-disabled");

    this.scrambleSprite = scene.add.sprite(x, y, "all-assets", "scramble/scramble-00");
    this.scrambleSprite.setDepth(yPositionToDepth(y));
    this.scrambleSprite.setScale(1.25);

    scene.anims.create({
      key: `scramble-tile`,
      frames: scene.anims.generateFrameNames("all-assets", {
        prefix: `scramble/scramble-`,
        start: 0,
        end: 35,
        zeroPad: 2,
      }),
      frameRate: 12,
      repeat: -1,
    });

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

    this.scramblePoser = new TweenPoser(scene, this.scrambleSprite, { duration: 100 });
    this.scramblePoser.definePoses({
      FadeIn: { alpha: 1 },
      FadeOut: { alpha: 0 },
    });
    this.scramblePoser.setToPose("FadeOut");

    this.tileMagnifyPoser = new TweenPoser(scene, this.container, { duration: 50 });
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

    this.secondarySelectKey = scene.input.keyboard.addKey(Input.Keyboard.KeyCodes.SHIFT);
  }

  removeTileContents() {
    this.tileContents?.setVisible(false);
    this.isCurrentlyBlank = true;
    this.level.onTileContentsUpdated(this);
  }

  playTileEffectAnimation(playerX: number, playerY: number) {
    return new Promise<void>((resolve) => {
      if (
        this.type === TILE_TYPES.GOLD ||
        this.type === TILE_TYPES.KEY ||
        isEnemyTile(this.type) ||
        isPickup(this.type)
      ) {
        if (!this.tileContents) return;
        if (this.tileGraphicTimeline) this.tileGraphicTimeline.destroy();

        this.tileGraphicTimeline = this.scene.tweens.createTimeline();

        // Setup different animations for the Gold vs. the Enemy graphics.
        if (this.type === TILE_TYPES.GOLD || this.type === TILE_TYPES.KEY || isPickup(this.type)) {
          this.tileGraphicTimeline = createPickupAnimation(this.scene, this.tileContents);
          this.sound.playSfx(AUDIO_KEYS.TILE_PICKUP);
        } else if (isEnemyTile(this.type)) {
          this.tileGraphicTimeline = createAttackAnimation(this.scene, this.tileContents);
          this.sound.playSfx(AUDIO_KEYS.TILE_PICKUP);
          this.tileGraphicTimeline.on("complete", () => {
            const attackAnimKey = `attack-fx-${Phaser.Math.RND.integerInRange(4, 5)}`;
            const attackAnim = new AttackAnimation(
              this.scene,
              attackAnimKey,
              playerX - 40,
              playerY - 28,
              this.sound
            );
            attackAnim.fadeout().then(() => attackAnim.destroy());
          });
        } else {
          // This is an empty tile, but we still wanna play the flip sound.
          this.sound.playSfx(AUDIO_KEYS.TILE_PICKUP);
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
      if (this.type === TILE_TYPES.GOLD || isEnemyTile(this.type) || isPickup(this.type)) {
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
    const event =
      pointer.rightButtonDown() || this.secondarySelectKey.isDown
        ? EVENTS.TILE_SELECT_SECONDARY
        : EVENTS.TILE_SELECT_PRIMARY;
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

  /**
   * Flip the tile to reveal the contents.
   */
  async flipToFront({
    playSfx = true,
    showContents = true,
  }: {
    /**
     * Whether or not to play the tile flip sound. Used in level.ts to stagger
     * and batch tile flipping without playing a SFX for each flip.
     */
    playSfx?: boolean;
    /**
     * Whether or not to show the contents of the tile when flipping. Almost
     * always true, except on the tutorial level.
     */
    showContents?: boolean;
  } = {}): Promise<void> {
    if (this.isRevealed) return;
    this.isRevealed = true;
    if (!this.isCurrentlyBlank && this.tileContents) {
      this.flipEffect.events.once("halfway", () => {
        if (showContents) this.tileContents.setVisible(true);
        this.contentsMagnifyPoser.moveToPose("ZoomIn");
      });
    }
    return new Promise((resolve) => {
      this.flipEffect.events.once("complete", () => {
        resolve();
        this.level.onTileFlip(this);
      });
      this.flipEffect.flipToFront();
      if (playSfx) {
        this.sound.playSfx(AUDIO_KEYS.TILE_PLACE);
      }
    });
  }

  /**
   * Flip the tile to hide the contents.
   */
  async flipToBack({
    playSfx = true,
  }: {
    /**
     * Whether or not to play the tile flip sound. Used in level.ts to stagger
     * and batch tile flipping without playing a SFX for each flip.
     */
    playSfx?: boolean;
  } = {}): Promise<void> {
    if (!this.isRevealed) return;
    this.isRevealed = false;
    this.tileContents?.setVisible(false);
    this.contentsMagnifyPoser.moveToPose("ZoomOut");
    return new Promise((resolve) => {
      this.flipEffect.events.once("complete", () => {
        resolve();
        this.level.onTileFlip(this);
      });
      this.flipEffect.flipToBack();
      if (playSfx) {
        this.sound.playSfx(AUDIO_KEYS.TILE_PLACE);
      }
    });
  }

  scramble() {
    this.isScrambled = true;
    this.scramblePoser.moveToPose("FadeIn");
    this.scrambleSprite.play("scramble-tile");
  }

  clearScramble() {
    this.isScrambled = false;
    this.scramblePoser.moveToPose("FadeOut");
    this.scrambleSprite.stop();
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

  getCurrentTileType() {
    return this.isCurrentlyBlank ? TILE_TYPES.BLANK : this.type;
  }

  destroy() {
    this.scramblePoser.destroy();
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

export type TileFlipToFrontInput = Parameters<Tile["flipToFront"]>[0];
export type TileFlipToBackInput = Parameters<Tile["flipToBack"]>[0];
