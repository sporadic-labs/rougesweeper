import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import { MagnifyEffect } from "../components/magnify-effect";

export enum INVENTORY_ITEMS {
  COMPASS = "COMPASS",
  REVEAL_IN_RADAR = "REVEAL_IN_RADAR",
  REVEAL_TILE = "REVEAL_TILE"
}

export default class InventoryToggle {
  scene: Phaser.Scene;
  gameStore: GameStore;

  type: INVENTORY_ITEMS;

  sprite: Phaser.GameObjects.Sprite;

  proxy: EventProxy;
  mobProxy: MobXProxy;

  disabled: boolean;
  isInteractive: boolean;

  magnifyEffect: MagnifyEffect;

  tween: Phaser.Tweens.Tween;

  cb: Function;

  get height(): number {
    return this.sprite?.height;
  }

  get position(): { x: number; y: number } {
    return { x: this.sprite?.x, y: this.sprite?.y };
  }

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(
    scene: Phaser.Scene,
    gameStore: GameStore,
    type: INVENTORY_ITEMS,
    x: number,
    y: number,
    assetSheet: string,
    key: string,
    cb: Function
  ) {
    this.scene = scene;
    this.gameStore = gameStore;

    this.type = type;

    this.sprite = scene.add
      .sprite(x, y, assetSheet, key)
      .setOrigin(0.5, 0.5)
      .setDepth(DEPTHS.HUD);

    this.cb = cb;

    this.magnifyEffect = new MagnifyEffect(scene, this.sprite, 1, 1.05, 100);

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

  setPosition(x: number, y: number) {
    this.sprite.x = x;
    this.sprite.y = y;
  }

  enableInteractive() {
    if (this.isInteractive) return;
    this.isInteractive = true;
    this.sprite.setInteractive();
    this.sprite.on("pointerover", this.onHoverStart);
    this.sprite.on("pointerout", this.onHoverEnd);
    this.sprite.on("pointerdown", this.onPointerDown);
    this.sprite.on("pointerup", this.onPointerUp);
    // this.sprite.setAlpha(1);
  }

  disableInteractive() {
    if (!this.isInteractive) return;
    this.isInteractive = false;
    this.sprite.disableInteractive();
    this.sprite.off("pointerover", this.onHoverStart);
    this.sprite.off("pointerout", this.onHoverEnd);
    this.sprite.off("pointerdown", this.onPointerDown);
    this.sprite.off("pointerup", this.onPointerUp);
    // this.sprite.setAlpha(0.5);
  }

  onHoverStart = () => {
    this.magnifyEffect.scaleUp();
  };

  onHoverEnd = () => {
    this.magnifyEffect.scaleDown();
  };

  onPointerDown = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 0.95,
      scaleY: 0.95,
      duration: 100
    });

    if (this.cb) this.cb(this);
  };

  onPointerUp = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100
    });
  };

  setActive = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      alpha: 1,
      duration: 100
    });
  };

  setInactive = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.sprite,
      alpha: 0.32,
      duration: 100
    });
  };

  destroy() {
    if (this.tween) this.tween.stop();
    this.magnifyEffect.destroy();
    this.sprite.destroy();
    this.proxy.removeAll();
  }
}
