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

export default class Shop {
  scene: Phaser.Scene;
  gameStore: GameStore;
  toastManager: ToastManager;
  costs = {
    ammo: 1,
    compass: 5,
    clearRadar: 4,
    revealTile: 3,
  };
  buyAmmoButton: ShopButton;
  buyCompassButton: ShopButton;
  buyClearRadarButton: ShopButton;
  buyRevealTileButton: ShopButton;
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
      .text(r.centerX, r.y + 25, "What would you like to buy?", titleStyle)
      .setOrigin(0.5, 0);

    const leaveButton = new TextButton(scene, r.centerX, r.bottom - 30, "Leave Shop", {
      origin: { x: 0.5, y: 1 },
    });
    leaveButton.events.on("DOWN", this.closeShop);
    this.leaveButton = leaveButton;

    // Figure out the total number of buttons we want based on what is unlocked.
    const { ammoLocked, clearRadarLocked, revealTileLocked, compassLocked } = gameStore;
    const buttonCount = 4;

    const y = r.centerY - 12;
    const getXPosition = (
      r: Phaser.Geom.Rectangle,
      buttonIndex: number,
      buttonTotal: number
    ): number => r.x + r.width * 0.2 + r.width * 0.8 * (buttonIndex / buttonTotal);

    const x1 = getXPosition(r, 0, buttonCount);
    const buyAmmoButton = new ShopButton(
      scene,
      x1,
      y,
      "all-assets",
      "ammo-full",
      "Buy",
      `Refill Ammo\nCost: ${this.costs.ammo} tech`,
      this.buyAmmoRefill,
      ammoLocked
    );
    this.buyAmmoButton = buyAmmoButton;

    const x2 = getXPosition(r, 1, buttonCount);
    const buyCompassButton = new ShopButton(
      scene,
      x2,
      y,
      "all-assets",
      "compass",
      "Buy",
      `Buy Compass\nfor level\nCost: ${this.costs.compass} tech`,
      this.buyCompass,
      compassLocked
    );
    this.buyCompassButton = buyCompassButton;

    const x3 = getXPosition(r, 2, buttonCount);
    const buyClearRadarButton = new ShopButton(
      scene,
      x3,
      y,
      "all-assets",
      "clear-radar",
      "Buy",
      `Buy EMP\n(max 1)\nCost: ${this.costs.clearRadar} tech`,
      this.buyClearRadar,
      clearRadarLocked
    );
    this.buyClearRadarButton = buyClearRadarButton;

    const x4 = getXPosition(r, 3, buttonCount);
    const buyRevealTileButton = new ShopButton(
      scene,
      x4,
      y,
      "all-assets",
      "reveal-tile",
      "Buy",
      `Buy Sniper\n(max 1)\nCost: ${this.costs.revealTile} tech`,
      this.buyRevealTile,
      revealTileLocked
    );
    this.buyRevealTileButton = buyRevealTileButton;

    const buttonContainer: Phaser.GameObjects.GameObject[] = [
      background,
      title,
      leaveButton.text,
      buyAmmoButton.container,
      buyCompassButton.container,
      buyClearRadarButton.container,
      buyRevealTileButton.container,
    ];

    this.container = scene.add
      .container(0, 0, buttonContainer)
      .setDepth(DEPTHS.MENU)
      .setVisible(false);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "isShopOpen", () => {
      if (gameStore.isShopOpen) this.openShop();
      else this.closeShop();
      leaveButton.reset(); // Bug: stays in pressed state, menu closing hides button w/o up event
      this.updateButtons();
    });

    this.mobProxy.observe(gameStore, "goldCount", () => {
      if (gameStore.isShopOpen) this.updateButtons();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
    this.proxy.on(
      scene.input.keyboard,
      "keydown-K",
      () => {
        this.gameStore.isShopOpen = !this.gameStore.isShopOpen;
      },
      this
    );
  }

  openShop = () => {
    this.resetButtons();
    this.gameStore.isShopOpen = true;
    this.container.setVisible(true);
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
  };

  updateButtons() {
    const {
      gameStore,
      costs,
      buyAmmoButton,
      buyCompassButton,
      buyClearRadarButton,
      buyRevealTileButton,
    } = this;
    const {
      goldCount,
      hasRevealTile,
      hasClearRadar,
      hasCompass,
      playerAmmo,
      maxPlayerAmmo,
      ammoLocked,
      clearRadarLocked,
      revealTileLocked,
      compassLocked,
    } = gameStore;

    const canRefillAmmo = playerAmmo < maxPlayerAmmo && goldCount >= costs.ammo && !ammoLocked;
    canRefillAmmo ? buyAmmoButton.enable() : buyAmmoButton.disable();

    const canBuyCompass = !hasCompass && goldCount >= costs.compass && !compassLocked;
    canBuyCompass ? buyCompassButton.enable() : buyCompassButton.disable();

    const canBuyClearRadar = !hasClearRadar && goldCount >= costs.clearRadar && !clearRadarLocked;
    canBuyClearRadar ? buyClearRadarButton.enable() : buyClearRadarButton.disable();

    const canBuyRevealTile = !hasRevealTile && goldCount >= costs.revealTile && !revealTileLocked;
    canBuyRevealTile ? buyRevealTileButton.enable() : buyRevealTileButton.disable();
  }

  closeShop = () => {
    this.gameStore.isShopOpen = false;
    this.container.setVisible(false);
    this.gameStore.goToPreviousGameState();
  };

  buyAmmoRefill = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.ammo) {
      gameStore.setAmmo(gameStore.maxPlayerAmmo);
      gameStore.removeGold(costs.ammo);
      this.toastManager.setMessage("Ammo refilled!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  buyClearRadar = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.clearRadar) {
      gameStore.setHasClearRadar(true);
      gameStore.removeGold(costs.clearRadar);
      this.toastManager.setMessage("EMP acquired!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  buyRevealTile = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.revealTile) {
      gameStore.setHasRevealTile(true);
      gameStore.removeGold(costs.revealTile);
      this.toastManager.setMessage("Sniper acquired!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  buyCompass = () => {
    const { gameStore, costs } = this;
    if (gameStore.goldCount >= costs.compass) {
      gameStore.setHasCompass(true);
      gameStore.removeGold(costs.compass);
      this.toastManager.setMessage("Compass acquired!");
    } else {
      this.toastManager.setMessage("Not enough Tech!");
    }
  };

  resetButtons() {
    const {
      buyAmmoButton,
      buyRevealTileButton,
      buyClearRadarButton,
      buyCompassButton,
      leaveButton,
    } = this;
    buyAmmoButton?.reset();
    buyRevealTileButton?.reset();
    buyClearRadarButton?.reset();
    buyCompassButton?.reset();
    leaveButton.reset();
  }

  destroy() {
    this.mobProxy.destroy();
    this.proxy.removeAll();
    this.container.destroy();
    this.buyAmmoButton?.destroy();
    this.buyCompassButton?.destroy();
    this.buyClearRadarButton?.destroy();
    this.buyRevealTileButton?.destroy();
    this.leaveButton.destroy();
  }
}
