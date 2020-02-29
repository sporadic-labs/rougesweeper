import Phaser, { Events, Input } from "phaser";
import EventProxy from "../../helpers/event-proxy";
import MobXProxy from "../../helpers/mobx-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";
import store, { GameStore } from "../../store/index";
import InventoryToggle, { INVENTORY_ITEMS } from "./inventory-toggle";
import GAME_MODES from "../game-manager/events";

export enum INVETORY_EVENTS {
  SELECT = "SELECT",
  DESELECT = "DESELECT"
}

export default class InventoryMenu {
  public events: Events.EventEmitter = new Events.EventEmitter();

  private scene: Phaser.Scene;
  private store: GameStore;
  private text: Phaser.GameObjects.Text;
  private icons: InventoryToggle[];

  private background: Phaser.GameObjects.Shape;
  private container: Phaser.GameObjects.Container;

  private mobxProxy: MobXProxy;
  private eventProxy: EventProxy;

  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.store = gameStore;

    this.text = scene.add
      .text(0, 0, "Stash", { fontSize: 20, fill: "#000000", fontStyle: "bold" })
      .setOrigin(0.5, 0);

    this.icons = [
      new InventoryToggle(
        scene,
        gameStore,
        INVENTORY_ITEMS.COMPASS,
        0,
        0,
        "all-assets",
        "compass",
        this.onPointerDown
      ),
      new InventoryToggle(
        scene,
        gameStore,
        INVENTORY_ITEMS.REVEAL_IN_RADAR,
        0,
        0,
        "all-assets",
        "clear-radar",
        this.onPointerDown
      ),
      new InventoryToggle(
        scene,
        gameStore,
        INVENTORY_ITEMS.REVEAL_TILE,
        0,
        0,
        "all-assets",
        "reveal-tile",
        this.onPointerDown
      )
    ];

    const iconSpacing = 6;
    const iconHeight = this.icons[0].height;
    const bgPadding = { x: 4, y: 25 };
    const bgWidth = 96;

    this.text.setPosition(bgWidth / 2, bgPadding.y);
    const iconStartY = this.text.y + this.text.height + 15;

    this.icons.forEach((icon, i) => {
      icon.setPosition(bgWidth / 2, iconStartY + iconHeight / 2 + (iconHeight + iconSpacing) * i);
    });

    this.enableInteractive();

    const bgHeight = this.icons[this.icons.length - 1].position.y + iconHeight / 2 + bgPadding.y;
    this.background = scene.add
      .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
      .setStrokeStyle(8, 0x585e5e, 1)
      .setOrigin(0, 0);

    this.container = scene.add
      .container(fractionToX(0.12), fractionToY(0.42), [
        this.background,
        this.text,
        ...this.icons.map(icon => icon.sprite)
      ])
      .setDepth(DEPTHS.HUD);

    this.mobxProxy = new MobXProxy();
    this.mobxProxy.observe(gameStore, "hasCompass", () => {
      if (store.hasCompass) this.icons[0].setActive();
      else this.icons[0].setInactive();
    });
    this.mobxProxy.observe(gameStore, "hasClearRadar", () => {
      if (store.hasClearRadar) this.icons[1].setActive();
      else this.icons[1].setInactive();
    });
    this.mobxProxy.observe(gameStore, "hasRevealTile", () => {
      if (store.hasRevealTile) this.icons[2].setActive();
      else this.icons[2].setInactive();
    });

    this.eventProxy = new EventProxy();
    this.eventProxy.on(scene.events, "shutdown", this.destroy, this);
    this.eventProxy.on(scene.events, "destroy", this.destroy, this);
  }

  /**
   * Enable user interactivity for the tile.
   */
  enableInteractive() {
    this.icons.forEach(icon => {
      icon.enableInteractive();
    });
  }

  /**
   * Disable user interactivity for the tile.
   */
  disableInteractive() {
    /* NOTE(rex): This handles the edge case of onHoverEnd never triggering,
     * since the gameManager disables interactivity when the move action kicks off.
     */
    this.icons.forEach(icon => {
      icon.disableInteractive();
    });
  }

  getSelected() {
    return this.icons.find(icon => icon.selected);
  }

  /**
   * Deselect any selected icons from your inventory.
   */
  deselectAll() {
    this.icons.forEach(icon => icon.setDeselected());
  }

  /**
   * Click handler for Inventory Icons.
   * @param toggle
   */
  onPointerDown = (toggle: InventoryToggle) => {
    this.icons.forEach(icon => {
      if (icon.type === toggle.type) {
        if (icon.selected) {
          icon.setDeselected();
          this.events.emit(INVETORY_EVENTS.DESELECT, toggle.type);
        } else {
          icon.setSelected();
          this.events.emit(INVETORY_EVENTS.SELECT, toggle.type);
        }
      } else {
        icon.setDeselected();
      }
    });
  };

  destroy() {
    this.events.destroy();
    this.icons.forEach(icon => icon.destroy());
    this.container.destroy();
    this.mobxProxy.destroy();
    this.eventProxy.removeAll();
  }
}
