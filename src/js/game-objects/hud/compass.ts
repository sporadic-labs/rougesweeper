import { Math as PMath } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import Level from "../level/level";
import Player from "../player";
import store from "../../store";

enum COMPASS_TARGETS {
  KEY = "KEY",
  DOOR = "DOOR"
}

export default class Compass {
  private sprite: Phaser.GameObjects.Sprite;
  private playerOffset: number;
  private angleOffset: number;
  private target: COMPASS_TARGETS;
  private mobProxy: MobXProxy;
  private proxy: EventProxy;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(private scene: Phaser.Scene, private player: Player, private level: Level) {
    this.playerOffset = 75;
    this.angleOffset = Math.PI / 2; // Graphic points up, so it's off by 90 deg

    this.sprite = scene.add
      .sprite(0, 0, "all-assets", "arrow")
      .setDepth(DEPTHS.BELOW_PLAYER)
      .setAlpha(0.95);

    if (store.hasKey) this.target = COMPASS_TARGETS.DOOR;
    else this.target = COMPASS_TARGETS.KEY;

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(store, "hasKey", () => {
      if (store.hasKey) this.target = COMPASS_TARGETS.DOOR;
      else this.target = COMPASS_TARGETS.KEY;
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "update", this.update, this);
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  update() {
    let target;
    if (this.target === COMPASS_TARGETS.KEY) target = this.level.getKeyWorldPosition();
    else if (this.target === COMPASS_TARGETS.DOOR) target = this.level.getExitWorldPosition();
    if (!target) return;
    const center = this.player.getPosition();
    const angle = PMath.Angle.BetweenPoints(center, target);
    this.sprite.rotation = angle + this.angleOffset;
    this.sprite.setPosition(
      center.x + this.playerOffset * Math.cos(angle),
      center.y + this.playerOffset * Math.sin(angle)
    );
  }

  destroy() {
    this.sprite.destroy();
    this.proxy.removeAll();
  }
}
