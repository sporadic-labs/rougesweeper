import { autorun } from "mobx";
import { Math as PMath } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import DEPTHS from "../depths";

export default class Compass {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, player, level) {
    this.scene = scene;
    this.player = player;
    this.level = level;
    this.playerOffset = 75;
    this.angleOffset = Math.PI / 2; // Graphic points up, so it's off by 90 deg

    this.sprite = scene.add
      .sprite(0, 0, "all-assets", "arrow")
      .setDepth(DEPTHS.ABOVE_PLAYER)
      .setAlpha(0.95);

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "update", this.update, this);
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  update() {
    const target = this.level.getExitWorldPosition();
    const center = this.level.gridXYToWorldXY(this.player.getGridPosition());
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
