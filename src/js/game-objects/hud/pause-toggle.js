import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import MobXProxy from "../../helpers/mobx-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";

export default class PauseToggle {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.gameStore = gameStore;
    const x = fractionToX(0.96);
    const y = fractionToY(0.06);

    this.sprite = scene.add.sprite(x, y, "all-assets", "gears").setDepth(DEPTHS.HUD);

    this.enableInteractive();

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "gameState", () => {
      if (!this.disabled) {
        if (gameStore.gameState === GAME_MODES.MENU_MODE) {
          this.disableInteractive();
        } else {
          this.enableInteractive();
        }
      }
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  enableInteractive() {
    if (this.isInteractive) return;
    this.isInteractive = true;
    this.sprite.setInteractive();
    this.sprite.on("pointerover", this.onHoverStart);
    this.sprite.on("pointerout", this.onHoverEnd);
    this.sprite.on("pointerdown", this.onPointerDown);
    this.sprite.on("pointerup", this.onPointerUp);
    this.sprite.setAlpha(1);
  }

  disableInteractive() {
    if (!this.isInteractive) return;
    this.isInteractive = false;
    this.sprite.disableInteractive();
    this.sprite.off("pointerover", this.onHoverStart);
    this.sprite.off("pointerout", this.onHoverEnd);
    this.sprite.off("pointerdown", this.onPointerDown);
    this.sprite.off("pointerup", this.onPointerUp);
    this.sprite.setAlpha(0.5);
  }

  onHoverStart = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100,
    });
  };

  onHoverEnd = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1,
      scaleY: 1,
      duration: 100,
    });
  };

  onPointerDown = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 0.95,
      scaleY: 0.95,
      opacity: 0.95,
      duration: 100,
    });
    this.gameStore.setPauseMenuOpen(true);
  };

  onPointerUp = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1.05,
      scaleY: 1.05,
      opacity: 1.0,
      duration: 100,
    });
  };

  destroy() {
    if (this.tween) this.tween.stop();
    this.sprite.destroy();
    this.proxy.removeAll();
  }
}
