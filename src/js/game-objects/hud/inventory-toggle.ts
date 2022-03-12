import EventProxy from "../../helpers/event-proxy";
import GAME_MODES from "../game-manager/game-modes";
import MobXProxy from "../../helpers/mobx-proxy";
import DEPTHS from "../depths";
import { GameStore } from "../../store/index";
import TweenPoser from "../components/tween-poser";

export enum INVENTORY_ITEMS {
  COMPASS = "COMPASS",
  REVEAL_IN_RADAR = "REVEAL_IN_RADAR",
  REVEAL_TILE = "REVEAL_TILE",
}

type FadePoses = "FadeOut" | "FadeIn";
type MagnifyPoses = "ZoomIn" | "ZoomOut" | "Select" | "ZoomInSelect";

export default class InventoryToggle {
  scene: Phaser.Scene;
  gameStore: GameStore;

  active: boolean;
  selected: boolean;
  type: INVENTORY_ITEMS;

  sprite: Phaser.GameObjects.Sprite;

  proxy: EventProxy;
  mobProxy: MobXProxy;

  disabled: boolean;
  isInteractive: boolean;

  magnifyPoser: TweenPoser<MagnifyPoses>;
  fadePoser: TweenPoser<FadePoses>;

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

    this.active = false;
    this.selected = false;

    this.sprite = scene.add
      .sprite(x, y, assetSheet, key)
      .setOrigin(0.5, 0.5)
      .setAlpha(0.32) // TODO(rex): Fix TweenPoser to set properties directly if the duration is 0
      .setDepth(DEPTHS.HUD);

    this.cb = cb;

    this.magnifyPoser = new TweenPoser(scene, this.sprite, { duration: 100 });
    this.magnifyPoser.definePose("ZoomIn", { scaleX: 1.12, scaleY: 1.12 });
    this.magnifyPoser.definePose("Select", { scaleX: 1.24, scaleY: 1.24 });
    this.magnifyPoser.definePose("ZoomInSelect", { scaleX: 1.32, scaleY: 1.32 });
    this.magnifyPoser.definePose("ZoomOut", { scaleX: 1, scaleY: 1 });
    this.magnifyPoser.setToPose("ZoomOut");

    this.fadePoser = new TweenPoser(scene, this.sprite, { duration: 100 });
    this.fadePoser.definePose("FadeIn", { alpha: 1 });
    this.fadePoser.definePose("FadeOut", { alpha: 0.32 });
    this.fadePoser.setToPose("FadeOut");

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
  }

  disableInteractive() {
    if (!this.isInteractive) return;
    this.isInteractive = false;
    this.sprite.disableInteractive();
    this.sprite.off("pointerover", this.onHoverStart);
    this.sprite.off("pointerout", this.onHoverEnd);
    this.sprite.off("pointerdown", this.onPointerDown);
  }

  onHoverStart = () => {
    if (this.selected) this.magnifyPoser.moveToPose("ZoomInSelect");
    else this.magnifyPoser.moveToPose("ZoomIn");
  };

  onHoverEnd = () => {
    if (this.selected) this.magnifyPoser.moveToPose("Select");
    else this.magnifyPoser.moveToPose("ZoomOut");
  };

  onPointerDown = () => {
    if (this.active) {
      if (this.cb) this.cb(this);
    } else {
      console.warn("Not allowed to select this particular item right now!");
    }
  };

  setSelected = () => {
    this.selected = true;
    this.magnifyPoser.moveToPose("Select");
  };

  setDeselected = () => {
    this.selected = false;
    this.magnifyPoser.moveToPose("ZoomOut");
  };

  setActive = () => {
    this.active = true;
    this.fadePoser.moveToPose("FadeIn");
  };

  setInactive = () => {
    this.active = false;
    this.selected = false;
    this.fadePoser.moveToPose("FadeOut");
    this.magnifyPoser.moveToPose("ZoomOut");
  };

  destroy() {
    this.fadePoser.destroy();
    this.magnifyPoser.destroy();
    this.sprite.destroy();
    this.proxy.removeAll();
  }
}
