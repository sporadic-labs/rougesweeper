import Phaser, { Tweens } from "phaser";
import EventEmitter from "../../helpers/event-emitter";

/**
 * This currently only does a horizontal flip, but we can extend to a vertical flip later if needed.
 */
export default class FlipEffect {
  public events: EventEmitter<{
    halfway: FlipEffect;
    complete: FlipEffect;
    start: FlipEffect;
  }> = new EventEmitter();
  private frontScale: number;
  private backScale: number;
  private flipTween?: Tweens.Tween;
  private flipProgress: number;
  private hasPassedHalfway = false;
  private flipDirection: "front" | "back";

  /**
   * @param {Phaser.Scene} scene
   * @param {GameObject} front
   * @param {GameObject} back
   */
  constructor(
    private scene: Phaser.Scene,
    private front: any,
    private back: any,
    { frontScale = 1, backScale = 1 } = {}
  ) {
    this.frontScale = frontScale;
    this.backScale = backScale;

    // flipProgress is a value between 1 (front facing up) and -1 (back facing up). It starts in a
    // neutral state so that the effect doesn't actually manipulate the game objects until the user
    // tells it to.
    this.flipProgress = 0;
  }

  setToBack() {
    this.flipProgress = -1;
    this.onFlipUpdate();
    return this;
  }

  setToFront() {
    this.flipProgress = 1;
    this.onFlipUpdate();
    return this;
  }

  /**
   * Check if a flip is running.x
   */
  isFlipping(): boolean {
    return this.flipTween?.isPlaying() ?? false;
  }

  /**
   * Immediately stop any tweening. If it's running, it will freezing mid-flip and won't emit the
   * "complete" event.
   */
  stopFlip() {
    this.flipTween?.stop();
  }

  flipToBack() {
    this.stopFlip();
    this.flipDirection = "back";
    this.hasPassedHalfway = false;
    this.flipTween = this.scene.tweens.add({
      targets: this,
      flipProgress: -1,
      duration: 300,
      ease: "Quad.easeOut",
      onStart: this.onFlipStart,
      onStartScope: this,
      onUpdate: this.onFlipUpdate,
      onUpdateScope: this,
      onComplete: this.onFlipComplete,
      onCompleteScope: this
    });
    return this;
  }

  flipToFront() {
    this.stopFlip();
    this.flipDirection = "front";
    this.hasPassedHalfway = false;
    this.flipTween = this.scene.tweens.add({
      targets: this,
      flipProgress: 1,
      duration: 300,
      ease: "Quad.easeOut",
      onStart: this.onFlipStart,
      onStartScope: this,
      onUpdate: this.onFlipUpdate,
      onUpdateScope: this,
      onComplete: this.onFlipComplete,
      onCompleteScope: this
    });
    return this;
  }

  flip() {
    if (this.flipProgress > 0) this.flipToBack();
    else this.flipToBack();
    return this;
  }

  private onFlipUpdate() {
    if (!this.hasPassedHalfway) {
      if (this.flipDirection == "front" && this.flipProgress >= 0) {
        this.hasPassedHalfway = true;
        this.onFlipHalfway();
      } else if (this.flipDirection == "back" && this.flipProgress <= 0) {
        this.hasPassedHalfway = true;
        this.onFlipHalfway();
      }
    }
    if (this.flipProgress > 0) {
      this.front.scaleX = this.flipProgress * this.frontScale;
      this.back.setVisible(false);
      this.front.setVisible(true);
    } else {
      this.back.scaleX = -this.flipProgress * this.backScale;
      this.back.setVisible(true);
      this.front.setVisible(false);
    }
  }

  private onFlipStart() {
    this.events.emit("start", this);
  }

  private onFlipHalfway() {
    this.events.emit("halfway", this);
  }

  private onFlipComplete() {
    this.events.emit("complete", this);
  }

  destroy() {
    this.front = undefined;
    this.back = undefined;
    this.stopFlip();
  }
}
