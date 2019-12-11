interface TweenableScaleAngle {
  scaleX: number;
  scaleY: number;
  angle: number;
}

export default function createTileDisappearAnimation(
  scene: Phaser.Scene,
  target: TweenableScaleAngle
): Phaser.Tweens.Timeline {
  const timeline = scene.tweens.createTimeline({});
  return timeline.add({
    targets: target,
    duration: 400,
    ease: Phaser.Math.Easing.Quadratic.In,
    scaleX: 0.25,
    scaleY: 0.25,
    angle: 720
  });
}
