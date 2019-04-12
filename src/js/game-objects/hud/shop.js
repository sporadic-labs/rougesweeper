import EventProxy from "../../helpers/event-proxy";
import store from "../../store";
import GAME_MODES from "../game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";
import TextButton from "./text-button";

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
  /** @param {Phaser.Scene} scene */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.gameStore = gameStore;
    this.costs = {
      heart: 3,
      attack: 4,
      compass: 5
    };

    const { width, height } = scene.game.config;
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
    const x1 = r.x + r.width * (1 / 6);
    const x2 = r.x + r.width * (3 / 6);
    const x3 = r.x + r.width * (5 / 6);
    const buyHeartText = scene.add
      .text(
        x1,
        y - 40,
        `Reduce alert\n(max 3)\nCost: ${this.costs.heart} tech`,
        itemTextStyle
      )
      .setOrigin(0.5, 0.5);
    const buyHeartButton = new TextButton(scene, x1, y + 40, "Buy");
    buyHeartButton.events.on("DOWN", this.buyHealth);
    this.buyHeartButton = buyHeartButton;
    const buyAttackText = scene.add
      .text(
        x2,
        y - 40,
        `Buy attack\n(max 3)\nCost: ${this.costs.attack} tech`,
        itemTextStyle
      )
      .setOrigin(0.5, 0.5);
    const buyAttackButton = new TextButton(scene, x2, y + 40, "Buy");
    buyAttackButton.events.on("DOWN", this.buyAttack);
    this.buyAttackButton = buyAttackButton;
    const buyCompassText = scene.add
      .text(
        x3,
        y - 40,
        `Buy compass\nfor level\nCost: ${this.costs.compass} tech`,
        itemTextStyle
      )
      .setOrigin(0.5, 0.5);
    const buyCompassButton = new TextButton(scene, x3, y + 40, "Buy");
    buyCompassButton.events.on("DOWN", this.buyCompass);
    this.buyCompassButton = buyCompassButton;

    this.container = scene.add
      .container(0, 0, [
        background,
        title,
        leaveButton.text,
        buyAttackText,
        buyAttackButton.text,
        buyHeartText,
        buyHeartButton.text,
        buyCompassText,
        buyCompassButton.text
      ])
      .setDepth(100)
      .setVisible(false);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "isShopOpen", () => {
      this.container.setVisible(gameStore.isShopOpen);
      leaveButton.reset(); // Bug: stays in pressed state, menu closing hides button w/o up event
      this.updateButtons();
    });
    this.mobProxy.observe(gameStore, "goldCount", () => {
      if (gameStore.isShopOpen) this.updateButtons();
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateButtons() {
    const { gameStore, costs, buyHeartButton, buyAttackButton, buyCompassButton } = this;
    const {
      goldCount,
      playerHealth,
      maxPlayerHealth,
      attackCount,
      maxAttackCount,
      hasCompass
    } = gameStore;
    const canBuyHeart = playerHealth < maxPlayerHealth && goldCount >= costs.heart;
    const canBuyAttack = attackCount < maxAttackCount && goldCount >= costs.attack;
    const canBuyCompass = !hasCompass && goldCount >= costs.compass;
    buyHeartButton.setVisible(canBuyHeart);
    buyAttackButton.setVisible(canBuyAttack);
    buyCompassButton.setVisible(canBuyCompass);
  }

  closeShop = () => (this.gameStore.isShopOpen = false);

  buyAttack = () => {
    const { gameStore, costs } = this;
    gameStore.removeGold(costs.attack);
    gameStore.addAttack(1);
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
