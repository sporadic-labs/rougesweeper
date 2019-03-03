import MovementController from "./movement-controller";
import EventProxy from "../../helpers/event-proxy";

export default class Player {
  constructor(scene, x, y) {
    this.sprite = scene.add.sprite(x, y, "assets", "kenney-ship");
    scene.physics.world.enable(this.sprite);
    this.movementController = new MovementController(this, this.sprite.body, scene);

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "update", this.update, this);
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  update(time, delta) {
    this.movementController.update(time, delta);
  }

  destroy() {
    this.movementController.destroy();
    this.sprite.destroy();
    this.proxy.removeAll();
  }
}
