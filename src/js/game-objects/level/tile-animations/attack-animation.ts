interface TweenableScalePosAngle {
  scaleX: number;
  scaleY: number;
  x: number;
  angle: number;
}

export default function createAttackAnimation(
  scene: Phaser.Scene,
  target: TweenableScalePosAngle
): Phaser.Tweens.Timeline {
  const timeline = scene.tweens.createTimeline({});
  return timeline
    .add({
      targets: target,
      ease: Phaser.Math.Easing.Quadratic.InOut,
      duration: 200,
      x: 10,
      angle: 5
    })
    .add({
      targets: target,
      duration: 150,
      ease: Phaser.Math.Easing.Quadratic.In,
      x: -10,
      angle: -10
    })
    .add({
      targets: target,
      duration: 150,
      ease: Phaser.Math.Easing.Quadratic.Out,
      scaleX: 0.5,
      scaleY: 0.5,
      x: 0,
      angle: 0
    });
}
