import { autorun, IReactionDisposer } from "mobx";
import EventProxy from "../../helpers/event-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import { GameStore } from "../../store";
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
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
    });
    this.poser.definePoses({
      Default: {},
      Hover: { scaleX: 1.25, scaleY: 1.25 },
      Disabled: { alpha: 0.5 },
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
const enum ITEM {
  HACK = "tech-2",
  CLEAR_RADAR = "clear-radar",
  COMPASS = "compass",
  REVEAL_TILE = "reveal-tile",
}

const allItems = [ITEM.HACK, ITEM.CLEAR_RADAR, ITEM.COMPASS, ITEM.REVEAL_TILE];

export default class ItemSwitcher {
  private currentItemIndex = 0;
  private ammoText: Phaser.GameObjects.Text;
  private weaponSprite: Phaser.GameObjects.Sprite;
  private leftButton: ArrowButton;
  private rightButton: ArrowButton;
  private background: Phaser.GameObjects.Shape;
  private container: Phaser.GameObjects.Container;
  private proxy: EventProxy;
  private dispose: IReactionDisposer;

  constructor(private scene: Phaser.Scene, private gameStore: GameStore) {
    const size = 96;
    const padding = 12;

    this.weaponSprite = scene.add
      .sprite(size * 0.5, padding, "all-assets", allItems[this.currentItemIndex])
      .setDisplaySize(size * 0.47, size * 0.47)
      .setOrigin(0.5, 0);

    this.ammoText = scene.add.text(size * 0.5, size - padding, "5/5", textStyle).setOrigin(0.5, 1);

    this.background = scene.add
      .rectangle(0, 0, size, size, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.leftButton = new ArrowButton(scene, size * 0.2, size * 0.4, "left");
    this.rightButton = new ArrowButton(scene, size * 0.8, size * 0.4, "right");
    this.leftButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.rightButton.events.addListener("pointerdown", this.onArrowButtonClick);
    this.container = scene.add
      // TODO: we should align placement of UI.
      .container(fractionToX(0.83), fractionToY(0.98) - size, [
        this.background,
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
    } else if (arrowButton === this.rightButton && this.currentItemIndex < allItems.length - 1) {
      this.currentItemIndex += 1;
    }
    this.updateState();
  };

  private updateState() {
    const item = allItems[this.currentItemIndex];
    this.weaponSprite.setFrame(item);
    this.ammoText.setText(`${this.gameStore.playerAmmo}/5`);
    this.leftButton.setEnabled(this.currentItemIndex > 0);
    this.rightButton.setEnabled(this.currentItemIndex < allItems.length - 1);
  }

  destroy() {
    this.dispose();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
