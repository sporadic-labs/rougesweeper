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
    private levelEvents: Events.EventEmitter
  ) {
    // TEMP
    this.sprite = scene.add.sprite(worldX, worldY, "all-assets", "stairs-1");
    this.sprite.setDepth(DEPTHS.GROUND);

    this.enableInteractive();
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
