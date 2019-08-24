import Phaser from "phaser";
const noop = () => {};

const { TWEEN_COMPLETE } = Phaser.Tweens.Events;

/**
 * A component that can tween along an array of {x, y} points. Control playback via play/stop.
 */
class PathTween {
  /**
   * Creates a new tween but does not automatically play it.
   *
   * @param {Phaser.Scene} scene
   * @param {[{x, y}]} points An array of 2 or more points in {x, y} format
   * @param {function} [onUpdate=noop] Function that will be called on every update of the tween. It
   * provides a single argument: the current point along the path.
   * @param {object} [tweenProps={}] Properties to control the tween. Note: you cannot use
   * onComplete or onUpdate in tweenProps currently.
   * */
  constructor(scene, points, onUpdate = noop, tweenProps = {}) {
    if (!points || !points.length > 1) {
      throw new Error("Cannot tween along a path with fewer than 2 points.");
    }

    const [firstPoint, ...otherPoints] = points;
    this.path = new Phaser.Curves.Path(firstPoint.x, firstPoint.y);
    otherPoints.forEach(p => this.path.lineTo(p.x, p.y));

    this.fractionComplete = 0;
    this.tween = scene.tweens.create({
      targets: this,
      fractionComplete: 1,
      ...tweenProps,
      onUpdate: () => {
        const p = this.path.getPoint(this.fractionComplete);
        onUpdate(p);
      }
    });
  }

  play() {
    return new Promise(resolve => {
      this.tween.on(TWEEN_COMPLETE, resolve);
      this.tween.play();
    });
  }

  stop() {
    this.tween.stop();
  }

  destroy() {
    this.stop();
  }
}

export default PathTween;
