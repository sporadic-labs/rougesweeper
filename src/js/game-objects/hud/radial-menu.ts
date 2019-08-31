import Phaser, { Events, Geom } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";

enum RadialOption {
  MOVE = "MOVE",
  HACK = "HACK",
  CLOSE = "CLOSE"
}

enum MenuEvents {
  VALID_OPTION_SELECT = "VALID_OPTION_SELECT",
  INVALID_OPTION_SELECT = "INVALID_OPTION_SELECT",
  MENU_CLOSE = "MENU_CLOSE"
}

class RadialMenuIcon {
  public events: Events.EventEmitter;
  public type: RadialOption;
  public isEnabled = false;
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private startX: number;
  private startY: number;
  private endX: number;
  private endY: number;
  private tween?: Phaser.Tweens.Tween;
  private radius = 20;

  constructor(
    scene: Phaser.Scene,
    label: RadialOption,
    angle: number,
    menuX: number,
    menuY: number,
    menuRadius: number
  ) {
    this.scene = scene;
    this.type = label;
    this.startX = menuX;
    this.startY = menuY;
    this.endX = menuX + Math.cos(angle) * menuRadius;
    this.endY = menuY + Math.sin(angle) * menuRadius;

    const circleGraphic = scene.add.graphics({
      fillStyle: { color: 0xf7f7db },
      lineStyle: { width: 4, color: 0xea5e5e }
    });
    circleGraphic.fillCircle(0, 0, this.radius);
    circleGraphic.strokeCircle(0, 0, this.radius);

    const textLabel = scene.add.text(0, 0, label, {
      fontFamily: "monospace",
      fontSize: "13px",
      color: "black"
    });
    textLabel.setOrigin(0.5, 0.5);

    this.container = scene.add.container(this.startX, this.startY, [circleGraphic, textLabel]);
    this.container.setVisible(false);

    const hitbox = new Geom.Circle(0, 0, this.radius);
    this.container.setInteractive(hitbox, Geom.Circle.Contains);

    this.events = new Events.EventEmitter();
    this.container.on("pointerdown", () => this.events.emit("pointerdown"));
  }

  setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;
  }

  open() {
    this.container.setAlpha(0);
    this.container.setVisible(true);
    this.container.setPosition(this.startX, this.startY);
    this.container.setInteractive();
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.container,
      x: this.endX,
      y: this.endY,
      alpha: this.isEnabled ? 0.95 : 0.5,
      duration: 250
    });
  }

  close() {
    this.container.disableInteractive();
    if (this.tween) this.tween.stop();
    this.tween = this.scene.tweens.add({
      targets: this.container,
      x: this.startX,
      y: this.startY,
      alpha: 0,
      duration: 250,
      onComplete: () => {
        this.container.setVisible(true);
      }
    });
  }

  destroy() {
    if (this.tween) this.tween.stop();
    this.container.destroy();
  }
}

class RadialMenu {
  private scene: Phaser.Scene;
  private graphic: Phaser.GameObjects.Graphics;
  private menuIcons: RadialMenuIcon[];
  private x: number = 0;
  private y: number = 0;
  private radius: number = 30;
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
      lineStyle: { width: 15, color: 0xea5e5e, alpha: 0.95 }
    });
    this.graphic.setPosition(this.x, this.y);
    this.graphic.strokeCircle(0, 0, this.radius);
    this.graphic.setVisible(false);

    const labels = [RadialOption.MOVE, RadialOption.HACK, RadialOption.CLOSE];
    const startAngle = -150 * (Math.PI / 180);
    this.menuIcons = labels.map((label, i) => {
      const angle = startAngle + (i / labels.length) * 2 * Math.PI;
      const icon = new RadialMenuIcon(scene, label, angle, x, y, this.radius);
      return icon;
    });

    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  setEnabledOptions(options: RadialOption[]) {
    this.menuIcons.forEach(icon => {
      const isEnabled = options.includes(icon.type);
      icon.setEnabled(isEnabled);
      icon.events.removeAllListeners();
      if (icon.type === RadialOption.CLOSE) {
        icon.events.on("pointerdown", () => this.events.emit(MenuEvents.MENU_CLOSE, icon.type));
      } else {
        const eventType = isEnabled
          ? MenuEvents.VALID_OPTION_SELECT
          : MenuEvents.INVALID_OPTION_SELECT;
        icon.events.on("pointerdown", () => this.events.emit(eventType, icon.type));
      }
    });
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
    if (this.tween) this.tween.stop();
    this.menuIcons.forEach(icon => icon.destroy());
    this.scene = undefined;
    this.events.destroy();
    this.graphic.destroy();
    this.mobProxy.destroy();
    this.proxy.removeAll();
  }
}

export default RadialMenu;
export { RadialOption, MenuEvents };
