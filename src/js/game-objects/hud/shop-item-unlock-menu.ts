import EventProxy from "../../helpers/event-proxy";
import store, { GameStore } from "../../store";
import GAME_MODES from "../game-manager/game-modes";
import MobXProxy from "../../helpers/mobx-proxy";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import ShopButton from "./shop-buttons";
import ToastManager from "./toast-manager";

const baseTextStyle = {
  align: "center",
  color: "#ffffff",
};
const titleStyle = {
  ...baseTextStyle,
  fontSize: "30px",
  fontStyle: "bold",
};

export default class ShopItemUnlockMenu {
  scene: Phaser.Scene;
  gameStore: GameStore;
  toastManager: ToastManager;
  costs = {
    ammo: 1,
    heart: 3,
    compass: 5,
    clearRadar: 4,
    revealTile: 3,
  };
  unlockAmmoButton: ShopButton;
  reduceAlertButton: ShopButton;
  unlockCompassButton: ShopButton;
  unlockClearRadarButton: ShopButton;
  unlockRevealTileButton: ShopButton;
  leaveButton: TextButton;
  container: Phaser.GameObjects.Container;
  mobProxy: MobXProxy;
  proxy: EventProxy;

  constructor(scene: Phaser.Scene, gameStore: GameStore, toastManager: ToastManager) {
    this.scene = scene;
    this.gameStore = gameStore;
    this.toastManager = toastManager;

    const width = Number(scene.game.config.width);
    const height = Number(scene.game.config.height);
    const modalWidth = width - 100;
    const modalHeight = 0.6 * height;

    const r = new Phaser.Geom.Rectangle((width - modalWidth) / 2, 50, modalWidth, modalHeight);
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.5);
    background.fillRect(0, 0, width, height);
    background.fillStyle(0x000000);
    background.fillRect(r.x, r.y, r.width, r.height);

    const title = scene.add
      .text(r.centerX, r.y + 25, "What would you like to do...", titleStyle)
      .setOrigin(0.5, 0);

    const leaveButton = new TextButton(scene, r.centerX, r.bottom - 30, "Close Terminal", {
      origin: { x: 0.5, y: 1 },
    });
    leaveButton.events.on("DOWN", this.closeShop);
    this.leaveButton = leaveButton;

    const y = r.centerY - 12;
    const x1 = r.x + r.width * 0.1 + r.width * 0.8 * (0 / 8);
    const x2 = r.x + r.width * 0.1 + r.width * 0.8 * (2 / 8);
    const x3 = r.x + r.width * 0.1 + r.width * 0.8 * (4 / 8);
    const x4 = r.x + r.width * 0.1 + r.width * 0.8 * (6 / 8);
    const x5 = r.x + r.width * 0.1 + r.width * 0.8 * (8 / 8);

    const reduceAlertButton = new ShopButton(
      scene,
      x1,
      y,
      "all-assets",
      "alarm-on",
      "Buy",
      `Reduce Alert\n(max 3)\nCost: ${this.costs.heart} tech`,
      this.reduceAlert
    );
    this.reduceAlertButton = reduceAlertButton;

    const unlockAmmoButton = new ShopButton(
      scene,
      x2,
      y,
      "all-assets",
      "ammo-full",
      "Unlock",
      `Unlock Ammo Refill\nCost: ${this.costs.ammo} tech`,
      this.unlockAmmo
    );
    this.unlockAmmoButton = unlockAmmoButton;

    const unlockCompassButton = new ShopButton(
      scene,
      x3,
      y,
      "all-assets",
      "compass",
      "Unlock",
      `Unlock Compass\nCost: ${this.costs.compass} tech`,
      this.unlockCompass
    );
    this.unlockCompassButton = unlockCompassButton;

    const unlockClearRadarButton = new ShopButton(
      scene,
      x4,
      y,
      "all-assets",
      "clear-radar",
      "Unlock",
      `Unlock EMP\nCost: ${this.costs.clearRadar} tech`,
      this.unlockClearRadar
    );
    this.unlockClearRadarButton = unlockClearRadarButton;

    const unlockRevealTileButton = new ShopButton(
      scene,
      x5,
      y,
      "all-assets",
      "reveal-tile",
      "Unlock",
      `Unlock Sniper\nCost: ${this.costs.revealTile} tech`,
      this.unlockRevealTile
    );
    this.unlockRevealTileButton = unlockRevealTileButton;

    // TODO(rex): Dynamically add/disable buttons based on the level?
    this.container = scene.add
      .container(0, 0, [
        background,
        title,
        leaveButton.text,
        reduceAlertButton.container,
        unlockAmmoButton.container,
        unlockCompassButton.container,
        unlockClearRadarButton.container,
        unlockRevealTileButton.container,
      ])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "isShopUnlockOpen", () => {
      if (gameStore.isShopUnlockOpen) this.openShop();
      else this.closeShop();
      leaveButton.reset(); // Bug: stays in pressed state, menu closing hides button w/o up event
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "ammoLocked", () => {
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "clearRadarLocked", () => {
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "revealTileLocked", () => {
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "compassLocked", () => {
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "goldCount", () => {
      if (gameStore.isShopUnlockOpen) this.updateButtons();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-L",
      () => {
        this.gameStore.isShopUnlockOpen = !this.gameStore.isShopUnlockOpen;
      },
      this
    );
  }

  openShop = () => {
    this.resetButtons();
    this.gameStore.setShopUnlockOpen(true);
    this.container.setVisible(true);
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
  };

  updateButtons() {
    const {
      gameStore,
      costs,
      unlockAmmoButton,
      reduceAlertButton,
      unlockRevealTileButton,
      unlockClearRadarButton,
      unlockCompassButton,
    } = this;
    const {
      goldCount,
      playerHealth,
      maxPlayerHealth,
      ammoLocked,
      clearRadarLocked,
      revealTileLocked,
      compassLocked,
    } = gameStore;

    // NOTE(rex): This is available at all consoles.
    const canBuyHeart = playerHealth < maxPlayerHealth && goldCount >= costs.heart;

    canBuyHeart ? reduceAlertButton.enable() : reduceAlertButton.disable();
    ammoLocked ? unlockAmmoButton.enable() : unlockAmmoButton.disable();
    revealTileLocked ? unlockRevealTileButton.enable() : unlockRevealTileButton.disable();
    clearRadarLocked ? unlockClearRadarButton.enable() : unlockClearRadarButton.disable();
    compassLocked ? unlockCompassButton.enable() : unlockCompassButton.disable();
  }

  closeShop = () => {
    this.gameStore.setShopUnlockOpen(false);
    this.container.setVisible(false);
    this.gameStore.goToPreviousGameState();
  };

  unlockAmmo = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.ammo) {
      gameStore.setAmmo(gameStore.maxPlayerAmmo);
      gameStore.setAmmoLocked(false);
      gameStore.removeGold(costs.ammo);
      this.toastManager.setMessage("Ammo refill unlocked!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  unlockClearRadar = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.clearRadar) {
      gameStore.setHasClearRadar(true);
      gameStore.setClearRadarLocked(false);
      gameStore.removeGold(costs.clearRadar);
      this.toastManager.setMessage("EMP unlocked!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  unlockRevealTile = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.revealTile) {
      gameStore.setHasRevealTile(true);
      gameStore.setRevealTileLocked(false);
      gameStore.removeGold(costs.revealTile);
      this.toastManager.setMessage("Sniper unlocked!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  reduceAlert = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.heart) {
      gameStore.addHealth(1);
      gameStore.removeGold(costs.heart);
      this.toastManager.setMessage("Alert level cleared!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  unlockCompass = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.compass) {
      gameStore.setHasCompass(true);
      gameStore.setCompassLocked(false);
      gameStore.removeGold(costs.compass);
      this.toastManager.setMessage("Compass unlocked!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  resetButtons() {
    const {
      reduceAlertButton,
      unlockRevealTileButton,
      unlockClearRadarButton,
      unlockCompassButton,
      leaveButton,
    } = this;
    reduceAlertButton.reset();
    unlockRevealTileButton.reset();
    unlockClearRadarButton.reset();
    unlockCompassButton.reset();
    leaveButton.reset();
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
    this.container.destroy();
    this.reduceAlertButton.destroy();
    this.unlockCompassButton.destroy();
    this.unlockClearRadarButton.destroy();
    this.unlockRevealTileButton.destroy();
  }
}
