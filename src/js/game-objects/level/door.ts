import { Scene, Events, GameObjects } from "phaser";
import EVENTS from "./events";
import DEPTHS from "../depths";
import FlipEffect from "../components/flip-effect";
import { MagnifyEffect } from "../components/magnify-effect";

export default class Door {
  private doorSprite: GameObjects.Sprite;
  private tileContainer: Phaser.GameObjects.Container;
  private tileFlipEffect: FlipEffect;
  private doorMagnifyEffect: MagnifyEffect;
  private tileMagnifyEffect: MagnifyEffect;

  constructor(
    private scene: Scene,
    worldX: number,
    worldY: number,
    private levelEvents: Events.EventEmitter,
    private doorPrefix: string,
    private isCurrentlyOpen = false,
    tileKey: string
  ) {
    const tileBack = scene.add.sprite(0, 0, "all-assets", "tile-back");
    const tileFront = scene.add.sprite(0, 0, "all-assets", tileKey);
    this.tileFlipEffect = new FlipEffect(scene, tileFront, tileBack);
    this.tileFlipEffect.setToBack();
    this.tileContainer = scene.add.container(worldX, worldY, [tileBack, tileFront]);
    this.tileContainer.setDepth(DEPTHS.BOARD);
    this.tileContainer.setSize(tileBack.width, tileFront.height);

    this.doorSprite = scene.add
      .sprite(worldX, worldY, "all-assets", `${doorPrefix}-0`)
      .setOrigin(0, 0.5)
      .setDepth(DEPTHS.DIALOGUE);

    scene.anims.create({
      key: `${doorPrefix}-open`,
      frames: scene.anims.generateFrameNames("all-assets", {
        prefix: `${doorPrefix}-`,
        start: 1,
        end: 7
      }),
      frameRate: 24
    });
    scene.anims.create({
      key: `${doorPrefix}-close`,
      frames: scene.anims.generateFrameNames("all-assets", {
        prefix: `${doorPrefix}-`,
        start: 7,
        end: 1
      }),
      frameRate: 24
    });

    this.doorMagnifyEffect = new MagnifyEffect(scene, this.doorSprite, 1.0, 1.1, 100);
    this.tileMagnifyEffect = new MagnifyEffect(scene, this.tileContainer, 1.0, 1.1, 100);
    this.enableInteractive();
  }

  isOpen() {
    return this.isCurrentlyOpen;
  }

  open() {
    if (!this.isCurrentlyOpen) {
      this.isCurrentlyOpen = true;
      this.doorSprite.play(`${this.doorPrefix}-open`);
    }
  }

  close() {
    if (this.isCurrentlyOpen) {
      this.isCurrentlyOpen = false;
      this.doorSprite.play(`${this.doorPrefix}-close`);
    }
  }

  enableInteractive() {
    this.doorSprite.setInteractive();
    this.doorSprite.on("pointerover", this.onHoverStart);
    this.doorSprite.on("pointerout", this.onHoverEnd);
    this.doorSprite.on("pointerdown", this.onPointerDown);
    this.tileContainer.setInteractive();
    this.tileContainer.on("pointerover", this.onHoverStart);
    this.tileContainer.on("pointerout", this.onHoverEnd);
    this.tileContainer.on("pointerdown", this.onPointerDown);
  }

  disableInteractive() {
    // NOTE(rex): This handles the edge case of onHoverEnd never triggering, since the gameManager
    // disables interactivity when the move action kicks off.
    this.onHoverEnd();
    this.doorSprite.disableInteractive();
    this.doorSprite.off("pointerover", this.onHoverStart);
    this.doorSprite.off("pointerout", this.onHoverEnd);
    this.doorSprite.off("pointerdown", this.onPointerDown);
    this.tileContainer.disableInteractive();
    this.tileContainer.off("pointerover", this.onHoverStart);
    this.tileContainer.off("pointerout", this.onHoverEnd);
    this.tileContainer.off("pointerdown", this.onPointerDown);
  }

  onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (pointer.primaryDown) {
      this.levelEvents.emit(EVENTS.EXIT_SELECT_PRIMARY, this);
    }
  };

  onHoverStart = () => {
    this.doorMagnifyEffect.scaleUp();
    this.tileMagnifyEffect.scaleUp();
    this.levelEvents.emit(EVENTS.EXIT_OVER, this);
  };

  onHoverEnd = () => {
    this.doorMagnifyEffect.scaleDown();
    this.tileMagnifyEffect.scaleDown();
    this.levelEvents.emit(EVENTS.EXIT_OUT, this);
  };

  destroy() {
    this.disableInteractive();
    this.doorMagnifyEffect.destroy();
    this.tileMagnifyEffect.destroy();
    this.scene = undefined;
    this.doorSprite.destroy();
  }
}
