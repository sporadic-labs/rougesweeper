import { autorun, IReactionDisposer } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { GameStore } from "../../store";
import TweenPoser from "../components/tween-poser";
import EventEmitter from "../../helpers/event-emitter";
import GAME_MODES from "../game-manager/game-modes";
import MobXProxy from "../../helpers/mobx-proxy";
import constants from "../../constants";
import { addUIPanel } from "../../helpers/add-ui-panel";

const textStyle = {
  color: constants.darkText,
  align: "center",
  fontSize: "22px",
  fontStyle: "bold",
};

type ArrowPoses = "Default" | "Hover" | "Disabled";

class ArrowButton {
  public events: EventEmitter<{
    pointerdown: ArrowButton;
  }> = new EventEmitter();
  private triangle: Phaser.GameObjects.Triangle;
  private poser: TweenPoser<ArrowPoses>;
  private isEnabled = true;
  private isOver = false;
  private proxy: EventProxy;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: "left" | "right") {
    this.events = new EventEmitter();

    const size = 20;
    this.triangle = scene.add.triangle(x, y, 0, size, size, size, 0.5 * size, 0, 0x585e5e, 1);
    this.triangle.setAngle(direction === "left" ? -90 : 90);

    this.poser = new TweenPoser(scene, this.triangle, {
      duration: 100,
      alpha: 1,
    });
    this.poser.definePoses({
      Default: { scaleX: 1, scaleY: 1 },
      Hover: { scaleX: 1.25, scaleY: 1.25 },
      Disabled: { scaleX: 1, scaleY: 1, alpha: 0.5 },
    });
    this.poser.setToPose("Default");

    this.triangle.setInteractive();
    this.triangle.on("pointerover", this.onPointerOver);
    this.triangle.on("pointerout", this.onPointerOut);
    this.triangle.on("pointerup", this.onPointerUp);

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  public getSprite() {
    return this.triangle;
  }

  public setEnabled(isEnabled: boolean) {
    this.isEnabled = isEnabled;
    this.updatePose();
  }

  public destroy() {
    this.events.destroy();
    this.poser.destroy();
    this.triangle.destroy();
    this.proxy.removeAll();
  }

  private onPointerOver = () => {
    if (!this.isEnabled) return;
    this.isOver = true;
    this.updatePose();
  };

  private onPointerOut = () => {
    if (!this.isEnabled) return;
    this.isOver = false;
    this.updatePose();
  };

  private onPointerUp = () => {
    if (!this.isEnabled) return;
    this.events.emit("pointerdown", this);
  };

  private updatePose() {
    let newPose: ArrowPoses = "Default";
    if (!this.isEnabled) {
      newPose = "Disabled";
    } else {
      if (this.isOver) newPose = "Hover";
      else newPose = "Default";
    }

    if (this.poser.getCurrentPose() !== newPose) {
      this.poser.moveToPose(newPose);
    }
  }
}

export default class ItemSwitcher {
  private currentItemIndex = 0;
  private ammoText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private weaponSprite: Phaser.GameObjects.Sprite;
  private leftButton: ArrowButton;
  private rightButton: ArrowButton;
  private container: Phaser.GameObjects.Container;
  private proxy: EventProxy;
  private dispose: IReactionDisposer;
  private leftKey: Phaser.Input.Keyboard.Key;
  private rightKey: Phaser.Input.Keyboard.Key;
  private aKey: Phaser.Input.Keyboard.Key;
  private dKey: Phaser.Input.Keyboard.Key;
  private mobxProxy: MobXProxy;

  constructor(private scene: Phaser.Scene, private gameStore: GameStore) {
    const size = { x: 1.75 * 96, y: 1.75 * 132 };
    const padding = 16;

    this.weaponSprite = scene.add
      .sprite(size.x * 0.5, size.y * 0.18, "all-assets", gameStore.activeItemInfo.imageKey)
      .setDisplaySize(size.x * 0.8, size.x * 0.8)
      .setOrigin(0.5, 0);

    this.nameText = scene.add.text(size.x * 0.5, padding, "", textStyle).setOrigin(0.5, 0);
    this.ammoText = scene.add.text(size.x * 0.5, size.y - padding, "", textStyle).setOrigin(0.5, 1);

    const uiPanel = addUIPanel({
      scene: this.scene,
      x: 0,
      y: 0,
      width: size.x,
      height: size.y,
      shadow: "hud",
      offset: 20,
      safeUsageOffset: 20,
    });

    this.leftButton = new ArrowButton(scene, size.x * 0.15, size.y * 0.88, "left");
    this.rightButton = new ArrowButton(scene, size.x * 0.85, size.y * 0.88, "right");
    this.leftButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.rightButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.container = scene.add
      // TODO: we should align placement of UI.
      .container(fractionToX(0.12), fractionToY(0.97) - size.y, [
        uiPanel,
        this.nameText,
        this.ammoText,
        this.weaponSprite,
        this.leftButton.getSprite(),
        this.rightButton.getSprite(),
      ])
      .setDepth(DEPTHS.HUD);

    // If the user doesn't have the weapon yet, disable it.
    // TODO(rex): For some reason this isn't working...
    if (gameStore.hasWeapon) this.container.disableInteractive();

    this.dispose = autorun(() => this.updateState());
    this.updateState();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);

    this.leftKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.LEFT);
    this.rightKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.RIGHT);
    this.aKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.dKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.proxy.on(this.leftKey, "down", () => this.shiftActiveItem("left"));
    this.proxy.on(this.rightKey, "down", () => this.shiftActiveItem("right"));
    this.proxy.on(this.aKey, "down", () => this.shiftActiveItem("left"));
    this.proxy.on(this.dKey, "down", () => this.shiftActiveItem("right"));

    // TODO(rex): For some reason this isn't working...
    this.mobxProxy = new MobXProxy();
    this.mobxProxy.observe(gameStore, "hasWeapon", () => {
      if (gameStore.hasWeapon) this.container.setInteractive();
      else this.container.disableInteractive();
    });
  }

  private shiftActiveItem(direction: "left" | "right") {
    const items = this.gameStore.unlockedItems;
    const index = this.gameStore.activeItemIndex;
    if (direction === "left") {
      const newIndex = index > 0 ? index - 1 : items.length - 1;
      this.gameStore.setActiveItem(items[newIndex].key);
    } else {
      const newIndex = index < items.length - 1 ? index + 1 : 0;
      this.gameStore.setActiveItem(items[newIndex].key);
    }
  }

  private onArrowButtonClick = (arrowButton: ArrowButton) => {
    if (arrowButton === this.leftButton) {
      this.shiftActiveItem("left");
    } else if (arrowButton === this.rightButton) {
      this.shiftActiveItem("right");
    }
    this.updateState();
  };

  private updateState() {
    // TODO: is this the right thing to do? Should we just always let you
    // interact with the item switcher?
    const isActive = this.gameStore.gameState === GAME_MODES.IDLE_MODE;

    const { label, ammo, capacity, imageKey } = this.gameStore.activeItemInfo;
    this.weaponSprite.setFrame(imageKey);
    this.weaponSprite.setAlpha(ammo > 0 ? 1 : 0.5);

    this.nameText.setText(label);
    this.ammoText.setText(`${ammo}/${capacity}`);

    this.leftButton.setEnabled(isActive);
    this.rightButton.setEnabled(isActive);
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
    this.mobxProxy.destroy();
  }
}
