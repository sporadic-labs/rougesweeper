import Phaser, { Events } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";

class RadialMenuIcon {
  private scene: Phaser.Scene;
  private graphic: Phaser.GameObjects.Graphics;
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private tween?: Phaser.Tweens.Tween;

  constructor(
    scene: Phaser.Scene,
    angle: number,
    menuX: number,
    menuY: number,
    menuRadius: number
  ) {
    this.scene = scene;
    this.startX = menuX;
    this.startY = menuY;
    this.endX = menuX + Math.cos(angle) * menuRadius;
    this.endY = menuY + Math.sin(angle) * menuRadius;

    this.graphic = scene.add.graphics({
      fillStyle: { color: 0xf7f7db },
      lineStyle: { width: 5, color: 0xea5efe }
    });
    this.graphic.fillCircle(0, 0, 30);
    this.graphic.strokeCircle(0, 0, 30);
    this.graphic.setVisible(false);
  }

  open() {
    this.graphic.setAlpha(0);
    this.graphic.setVisible(true);
    this.graphic.setPosition(this.startX, this.startY);
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.graphic,
      x: this.endX,
      y: this.endY,
      alpha: 0.95,
      duration: 250
    });
  }

  close() {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.graphic,
      x: this.startX,
      y: this.startY,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.graphic.setVisible(true);
      }
    });
  }

  destroy() {
    // todo
  }
}

class RadialMenu {
  private scene: Phaser.Scene;
  private graphic: Phaser.GameObjects.Graphics;
  private menuIcons: RadialMenuIcon[];
  private x: number = 0;
  private y: number = 0;
  private radius: number = 80;
  private mobProxy = new MobXProxy();
  private proxy = new EventProxy();
  private events: Events.EventEmitter;
  private tween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.events = new Events.EventEmitter();

    this.graphic = scene.add.graphics({
      lineStyle: { width: 25, color: 0xea5efe, alpha: 0.95 }
    });
    this.graphic.setPosition(this.x, this.y);
    this.graphic.strokeCircle(0, 0, this.radius);
    this.graphic.setVisible(false);

    this.menuIcons = [];
    for (let a = 0; a < 2 * Math.PI; a += (2 * Math.PI) / 3) {
      const icon = new RadialMenuIcon(scene, a, x, y, this.radius);
      this.menuIcons.push(icon);
    }

    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  open() {
    this.menuIcons.forEach(icon => icon.open());
    if (this.tween) this.tween.stop();
    this.graphic.setScale(0);
    this.graphic.setVisible(true);
    this.tween = this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 1,
      scaleY: 1,
      duration: 250
    });
  }

  close() {
    this.menuIcons.forEach(icon => icon.close());
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.graphic,
      scaleX: 0,
      scaleY: 0,
      duration: 250,
      onComplete: () => {
        this.graphic.setVisible(false);
      }
    });
  }

  destroy() {
    this.scene = undefined;
    this.events.destroy();
    this.graphic.destroy();
    this.menuIcons.forEach(icon => icon.destroy());
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}

export default RadialMenu;
