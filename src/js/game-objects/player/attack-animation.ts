import DEPTHS from "../depths";
import { Scene, GameObjects, Tweens } from "phaser";
import TweenPoser from "../components/tween-poser";

type FadePoses = "FadeOut" | "FadeIn";

export default class AttackAnimation {
  private sprite: GameObjects.Sprite;
  private tween: Tweens.Tween;
  private fadePoser: TweenPoser<FadePoses>;

  constructor(private scene: Scene, key: string, x: number, y: number) {
    this.scene = scene;

    this.sprite = scene.add.sprite(0, 0, "all-assets", key).setOrigin(0.5, 0.5);
    this.sprite.setDepth(DEPTHS.ABOVE_PLAYER);

    this.fadePoser = new TweenPoser(scene, this.sprite, { duration: 600, ease: "Quad.easeOut" });
    this.fadePoser.definePose("FadeIn", { alpha: 1 });
    this.fadePoser.definePose("FadeOut", { alpha: 0 });
    this.fadePoser.setToPose("FadeIn");

    this.setPosition(x, y);
  }

  fadeout(): Promise<void> {
    return new Promise((resolve) => {
      this.fadePoser.moveToPose("FadeOut", { onComplete: () => resolve() });
    });
  }

  setPosition(x: number, y: number) {
    const cx = x + this.sprite.width / 2;
    this.sprite.x = cx;
    this.sprite.y = y;
  }

  destroy() {
    this.fadePoser.destroy();
    this.sprite.destroy();
  }
}
