import Phaser, { Scene, Tweens } from "phaser";
import { Point } from "../../helpers/common-interfaces";
const noop = () => {};

const { TWEEN_COMPLETE } = Phaser.Tweens.Events;
type PointCallback = (p: Point) => void;

/**
 * A component that can tween along an array of {x, y} points. Control playback via play/stop.
 */
class PathTween {
  private path: Phaser.Curves.Path;
  private fractionComplete = 0;
  private tween: Tweens.Tween;

  /**
   * Creates a new tween but does not automatically play it.
   * @param scene
   * @param points
   * @param onUpdate Function that will be called on every update of the tween. It
   * provides a single argument: the current point along the path.
   * @param tweenProps Properties to control the tween. Note: you cannot use
   * onComplete or onUpdate in tweenProps currently.
   */
  constructor(scene: Scene, points: Point[], onUpdate: PointCallback = noop, tweenProps = {}) {
    if (!points || points.length <= 1) {
      throw new Error("Cannot tween along a path with fewer than 2 points.");
    }

    const [firstPoint, ...otherPoints] = points;
    this.path = new Phaser.Curves.Path(firstPoint.x, firstPoint.y);
    otherPoints.forEach(p => this.path.lineTo(p.x, p.y));

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

  play(): Promise<void> {
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
