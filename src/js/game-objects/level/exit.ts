import { Scene, Events, GameObjects } from "phaser";
import EVENTS from "./events";
import DEPTHS from "../depths";

export default class Exit {
  private sprite: GameObjects.Sprite;
  private tween: Phaser.Tweens.Tween;

  constructor(
    private scene: Scene,
    worldX: number,
    worldY: number,
    private levelEvents: Events.EventEmitter,
    private doorName: string,
    private isCurrentlyOpen = false
  ) {
    // TODO: use doorName to figure out which sprites/anims to load.

    this.sprite = scene.add.sprite(worldX, worldY, "all-assets", "hq/hq-door-right-0");
    this.sprite.setDepth(DEPTHS.GROUND);

    scene.anims.create({
      key: "hq-door-open",
      frames: scene.anims.generateFrameNames("all-assets", {
        prefix: "hq/hq-door-right-",
        start: 1,
        end: 7
      }),
      frameRate: 24
    });
    scene.anims.create({
      key: "hq-door-close",
      frames: scene.anims.generateFrameNames("all-assets", {
        prefix: "hq/hq-door-right-",
        start: 7,
        end: 1
      }),
      frameRate: 24
    });

    this.enableInteractive();
  }

  isOpen() {
    return this.isCurrentlyOpen;
  }

  open() {
    if (!this.isCurrentlyOpen) {
      this.isCurrentlyOpen = true;
      this.sprite.play("hq-door-open");
    }
  }

  close() {
    if (this.isCurrentlyOpen) {
      this.isCurrentlyOpen = false;
      this.sprite.play("hq-door-close");
    }
  }

  enableInteractive() {
    this.sprite.setInteractive();
    this.sprite.on("pointerover", this.onHoverStart);
    this.sprite.on("pointerout", this.onHoverEnd);
    this.sprite.on("pointerdown", this.onPointerDown);
  }

  disableInteractive() {
    // NOTE(rex): This handles the edge case of onHoverEnd never triggering, since the gameManager
    // disables interactivity when the move action kicks off.
    this.onHoverEnd();
    this.sprite.disableInteractive();
    this.sprite.off("pointerover", this.onHoverStart);
    this.sprite.off("pointerout", this.onHoverEnd);
    this.sprite.off("pointerdown", this.onPointerDown);
  }

  onPointerDown = (pointer: Phaser.Input.Pointer) => {
    if (pointer.primaryDown) {
      this.levelEvents.emit(EVENTS.EXIT_SELECT_PRIMARY, this);
    }
  };

  onHoverStart = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 100
    });
    this.levelEvents.emit(EVENTS.EXIT_OVER, this);
  };

  onHoverEnd = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 100
    });
    this.levelEvents.emit(EVENTS.EXIT_OUT, this);
  };

  destroy() {
    this.disableInteractive();
    if (this.tween) this.tween.stop();
    this.scene = undefined;
    this.sprite.destroy();
  }
}
