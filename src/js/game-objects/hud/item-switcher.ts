import { autorun, IReactionDisposer } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { GameStore, ItemName } from "../../store";
import TweenPoser from "../components/tween-poser";
import { Events } from "matter";
import EventEmitter from "../../helpers/event-emitter";

const textStyle = {
  color: "#585e5e",
  align: "center",
  fontSize: "20px",
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

    const size = 14;
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

// Use the frame names for the all-assets texture
const ITEM_FRAME_NAMES: Record<ItemName, string> = {
  hack: "tech-2",
  clearRadar: "clear-radar",
  compass: "compass",
  revealTile: "reveal-tile",
};

const ITEM_LABELS: Record<ItemName, string> = {
  hack: "tech-2",
  clearRadar: "clear-radar",
  compass: "compass",
  revealTile: "reveal-tile",
};

const ALL_ITEMS = ["hack", "clearRadar", "compass", "revealTitle"];

export default class ItemSwitcher {
  private currentItemIndex = 0;
  private ammoText: Phaser.GameObjects.Text;
  private nameText: Phaser.GameObjects.Text;
  private weaponSprite: Phaser.GameObjects.Sprite;
  private leftButton: ArrowButton;
  private rightButton: ArrowButton;
  private background: Phaser.GameObjects.Shape;
  private container: Phaser.GameObjects.Container;
  private proxy: EventProxy;
  private dispose: IReactionDisposer;

  constructor(private scene: Phaser.Scene, private gameStore: GameStore) {
    const size = { x: 96, y: 110 };
    const padding = 12;


    this.weaponSprite = scene.add
      .sprite(size.x * 0.5, size.y * 0.25, "all-assets", ITEM_FRAME_NAMES[gameStore.activeItem]])
      .setDisplaySize(size.x * 0.47, size.x * 0.47)
      .setOrigin(0.5, 0);

    this.nameText = scene.add
      .text(size.x * 0.5, padding, "", { ...textStyle, fontSize: "18px" })
      .setOrigin(0.5, 0);
    this.ammoText = scene.add
      .text(size.x * 0.5, size.y - padding, "", textStyle)
      .setOrigin(0.5, 1);

    this.background = scene.add
      .rectangle(0, 0, size.x, size.y, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.leftButton = new ArrowButton(scene, size.x * 0.2, size.y * 0.47, "left");
    this.rightButton = new ArrowButton(scene, size.x * 0.8, size.y * 0.47, "right");
    this.leftButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.rightButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.container = scene.add
      // TODO: we should align placement of UI.
      .container(fractionToX(0.83), fractionToY(0.98) - size.y, [
        this.background,
        this.nameText,
        this.ammoText,
        this.weaponSprite,
        this.leftButton.getSprite(),
        this.rightButton.getSprite(),
      ])
      .setDepth(DEPTHS.HUD);

    this.dispose = autorun(() => this.updateState());
    this.updateState();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  private onArrowButtonClick = (arrowButton: ArrowButton) => {
    if (arrowButton === this.leftButton && this.currentItemIndex > 0) {
      this.currentItemIndex -= 1;
    } else if (arrowButton === this.rightButton && this.currentItemIndex < ALL_ITEMS.length - 1) {
      this.currentItemIndex += 1;
    }
    // TODO: need to let game manager know that the item has switched.
    this.updateState();
  };

  private updateState() {
    this.gameStore.activeItem;

    const itemInfo = this.gameStore.getActiveItemInfo();
    this.weaponSprite.setFrame(this.gameStore.activeItem);

    let currentAmmo: number;
    let maxAmmo: number;
    let name: string;
    switch (item) {
      case ITEM.HACK:
        name = "Hack";
        currentAmmo = this.gameStore.hack.ammo;
        maxAmmo = this.gameStore.hack.capacity;
        break;
      case ITEM.CLEAR_RADAR:
        name = "Clear";
        currentAmmo = this.gameStore.clearRadar.ammo;
        maxAmmo = this.gameStore.clearRadar.capacity;
        break;
      case ITEM.COMPASS:
        name = "Compass";
        currentAmmo = this.gameStore.compass.ammo;
        maxAmmo = this.gameStore.compass.capacity;
        break;
      case ITEM.REVEAL_TILE:
        name = "Reveal";
        currentAmmo = this.gameStore.revealTile.ammo;
        maxAmmo = this.gameStore.revealTile.capacity;
        break;
      default:
        throw new Error("Unrecognized item type");
    }
    this.nameText.setText(name);
    this.ammoText.setText(`${currentAmmo}/${maxAmmo}`);

    this.leftButton.setEnabled(this.currentItemIndex > 0);
    this.rightButton.setEnabled(this.currentItemIndex < allItems.length - 1);
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
