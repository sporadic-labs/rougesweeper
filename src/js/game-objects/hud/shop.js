import EventProxy from "../../helpers/event-proxy";
import store from "../../store";
import GAME_MODES from "../game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";
import TextButton from "./text-button";

const titleStyle = {
  fontSize: 20,
  fontWeight: 600,
  fill: "#ffffff"
};

export default class Shop {
  /** @param {Phaser.Scene} scene */
  constructor(scene, gameStore) {
    this.scene = scene;
    this.gameStore = gameStore;

    const { width, height } = scene.game.config;

    const pad = 100;
    const background = scene.add.graphics();
    background.fillStyle(0x000000, 0.5);
    background.fillRect(0, 0, width, height);
    background.fillStyle(0x000000);
    background.fillRect(pad, pad, width - 2 * pad, height - 2 * pad);

    const title = scene.add
      .text(width / 2, pad + 25, "What would you like to buy?", titleStyle)
      .setOrigin(0.5, 0);

    const textButton = new TextButton(scene, width / 2, height - pad, "Leave Shop");
    textButton.events.on("DOWN", this.closeShop);

    this.container = scene.add
      .container(0, 0, [background, title, textButton.text])
      .setDepth(100)
      .setVisible(false);

    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "isShopOpen", () => {
      this.container.setVisible(gameStore.isShopOpen);
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  closeShop = () => (this.gameStore.isShopOpen = false);

  destroy() {
    this.mobProxy.destroy();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
