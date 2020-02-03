import EventProxy from "../../helpers/event-proxy";
import store, { GameStore } from "../../store";
import GAME_MODES from "../game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";
import TextButton from "./text-button";
import DEPTHS from "../depths";

const baseTextStyle = {
  align: "center",
  fill: "#ffffff"
};
const titleStyle = {
  ...baseTextStyle,
  fontSize: 30,
  fontStyle: "bold"
};
const itemTextStyle = {
  ...baseTextStyle,
  lineSpacing: 8,
  fontSize: 22
};

export default class Shop {
  scene: Phaser.Scene;
  gameStore: GameStore;
  costs = {
    heart: 3,
    compass: 5,
    clearRadar: 4,
    revealTile: 3
  };
  buyHeartButton: TextButton;
  buyCompassButton: TextButton;
  buyClearRadarButton: TextButton;
  buyRevealTileButton: TextButton;
  container: Phaser.GameObjects.Container;
  mobProxy: MobXProxy;
  proxy: EventProxy;

  constructor(scene: Phaser.Scene, gameStore: GameStore) {
    this.scene = scene;
    this.gameStore = gameStore;

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
      origin: { x: 0.5, y: 1 }
    });
    leaveButton.events.on("DOWN", this.closeShop);

    const y = r.centerY;
    const x1 = r.x + r.width * (1 / 8);
    const x2 = r.x + r.width * (3 / 8);
    const x3 = r.x + r.width * (5 / 8);
    const x4 = r.x + r.width * (7 / 8);
    const buyHeartText = scene.add
      .text(x1, y - 40, `Reduce alert\n(max 3)\nCost: ${this.costs.heart} tech`, itemTextStyle)
      .setOrigin(0.5, 0.5);
    const buyHeartButton = new TextButton(scene, x1, y + 40, "Buy");
    buyHeartButton.events.on("DOWN", this.buyHealth);
    this.buyHeartButton = buyHeartButton;
    const buyCompassText = scene.add
      .text(x2, y - 40, `Buy compass\nfor level\nCost: ${this.costs.compass} tech`, itemTextStyle)
      .setOrigin(0.5, 0.5);
    const buyCompassButton = new TextButton(scene, x2, y + 40, "Buy");
    buyCompassButton.events.on("DOWN", this.buyCompass);
    this.buyCompassButton = buyCompassButton;
    const buyClearRadar = scene.add
      .text(
        x3,
        y - 40,
        `Buy {RADAR CLEAR}\n(max 1)\nCost: ${this.costs.clearRadar} tech`,
        itemTextStyle
      )
      .setOrigin(0.5, 0.5);
    const buyClearRadarButton = new TextButton(scene, x3, y + 40, "Buy");
    buyClearRadarButton.events.on("DOWN", this.buyClearRadar);
    this.buyClearRadarButton = buyClearRadarButton;
    const buyRevealTile = scene.add
      .text(
        x4,
        y - 40,
        `Buy {REVEAL TILE}\n(max 1)\nCost: ${this.costs.revealTile} tech`,
        itemTextStyle
      )
      .setOrigin(0.5, 0.5);
    const buyRevealTileButton = new TextButton(scene, x4, y + 40, "Buy");
    buyRevealTileButton.events.on("DOWN", this.buyRevealTile);
    this.buyRevealTileButton = buyRevealTileButton;

    this.container = scene.add
      .container(0, 0, [
        background,
        title,
        leaveButton.text,
        buyHeartText,
        buyHeartButton.text,
        buyCompassText,
        buyCompassButton.text,
        buyClearRadar,
        buyClearRadarButton.text,
        buyRevealTile,
        buyRevealTileButton.text
      ])
      .setDepth(DEPTHS.MENU)
      .setVisible(false);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "isShopOpen", () => {
      if (gameStore.isShopOpen) this.openShop();
      else this.closeShop();
      leaveButton.reset(); // Bug: stays in pressed state, menu closing hides button w/o up event
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, () => {
      if (gameStore.isShopOpen) this.updateButtons();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  openShop = () => {
    this.gameStore.isShopOpen = true;
    this.container.setVisible(true);
    this.gameStore.setGameState(GAME_MODES.MENU_MODE);
  };

  updateButtons() {
    const {
      gameStore,
      costs,
      buyHeartButton,
      buyRevealTileButton,
      buyClearRadarButton,
      buyCompassButton
    } = this;
    const {
      goldCount,
      playerHealth,
      maxPlayerHealth,
      hasRevealTile,
      hasClearRadar,
      hasCompass
    } = gameStore;
    const canBuyHeart = playerHealth < maxPlayerHealth && goldCount >= costs.heart;
    const canBuyRevealTile = !hasRevealTile && goldCount >= costs.revealTile;
    const canBuyClearRadar = !hasClearRadar && goldCount >= costs.clearRadar;
    const canBuyCompass = !hasCompass && goldCount >= costs.compass;
    buyHeartButton.setVisible(canBuyHeart);
    buyRevealTileButton.setVisible(canBuyRevealTile);
    buyClearRadarButton.setVisible(canBuyClearRadar);
    buyCompassButton.setVisible(canBuyCompass);
  }

  closeShop = () => {
    this.gameStore.isShopOpen = false;
    this.container.setVisible(false);
    this.gameStore.goToPreviousGameState();
  };

  buyClearRadar = () => {
    const { gameStore, costs } = this;
    gameStore.removeGold(costs.clearRadar);
    gameStore.setHasClearRadar(true);
  };

  buyRevealTile = () => {
    const { gameStore, costs } = this;
    gameStore.removeGold(costs.revealTile);
    gameStore.setHasRevealTile(true);
  };

  buyHealth = () => {
    const { gameStore, costs } = this;
    gameStore.removeGold(costs.heart);
    gameStore.addHealth(1);
  };

  buyCompass = () => {
    const { gameStore, costs } = this;
    gameStore.removeGold(costs.compass);
    gameStore.setHasCompass(true);
  };

  destroy() {
    this.mobProxy.destroy();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
