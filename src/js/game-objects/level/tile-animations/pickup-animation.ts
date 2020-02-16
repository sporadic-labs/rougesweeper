interface TweenableScale {
  scaleX: number;
  scaleY: number;
}

export default function createPickupAnimation(
  scene: Phaser.Scene,
  target: TweenableScale
): Phaser.Tweens.Timeline {
  const timeline = scene.tweens.createTimeline({});
  return timeline
    .add({
      targets: target,
      ease: Phaser.Math.Easing.Quadratic.Out,
      duration: 200,
      scaleX: 1.05,
      scaleY: 1.05,
      y: "-=30"
    })
    .add({
      targets: target,
      duration: 200,
      ease: Phaser.Math.Easing.Quadratic.In,
      scaleX: 0.5,
      scaleY: 0.5,
      y: "-=0"
    });
}
