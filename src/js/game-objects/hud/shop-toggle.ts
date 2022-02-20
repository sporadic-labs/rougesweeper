import EventProxy from "../../helpers/event-proxy";
import store, { GameStore } from "../../store";
import GAME_MODES from "../game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";
import { fractionToX, fractionToY } from "../../game-dimensions";
import DEPTHS from "../depths";

export default class ShopToggle {
    scene: Phaser.Scene;
    gameStore: GameStore;
    mobProxy: MobXProxy;
    proxy: EventProxy;

    isInteractive: boolean;
    disabled: boolean;

    title: Phaser.GameObjects.Text;
    sprite: Phaser.GameObjects.Sprite;
    text: Phaser.GameObjects.Text;
    background: Phaser.GameObjects.Shape;
    container: Phaser.GameObjects.Container;

    tween: Phaser.Tweens.Tween;

    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene: Phaser.Scene, gameStore: GameStore) {
        this.scene = scene;
        this.gameStore = gameStore;
        const x = fractionToX(0.12);
        const y = fractionToY(0.48);

        const bgPadding = { x: 4, y: 25 };
        const bgWidth = 96;
        const iconSpacing = 6;

        this.title = scene.add
            .text(bgWidth / 2, bgPadding.y, "Shop", { fontSize: "20px", color: "#000000", fontStyle: "bold" })
            .setOrigin(0.5, 0);

        this.sprite = scene.add
            .sprite(bgWidth / 2, this.title.y + this.title.height + iconSpacing, "all-assets", "shop-button")
            .setOrigin(0.5, 0);

        const bgHeight = this.sprite.y + this.sprite.height + bgPadding.y;
        this.background = scene.add
            .rectangle(0, 0, bgWidth, bgHeight, 0xffffff)
            .setStrokeStyle(8, 0x585e5e, 1)
            .setOrigin(0, 0);

        this.container = scene.add
            .container(x, y, [
                this.background,
                this.title,
                this.sprite
            ])
            .setDepth(DEPTHS.HUD);

        this.enableInteractive();

        this.mobProxy = new MobXProxy();
        this.mobProxy.observe(gameStore, "gameState", () => {
            if (gameStore.shopLocked) {
                this.disableInteractive();
                this.disabled = true;
            } else {
                this.disabled = false;
            }

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

    enableInteractive() {
        if (this.isInteractive) return;
        this.isInteractive = true;
        this.sprite.setInteractive();
        this.sprite.on("pointerover", this.onHoverStart);
        this.sprite.on("pointerout", this.onHoverEnd);
        this.sprite.on("pointerdown", this.onPointerDown);
        this.sprite.on("pointerup", this.onPointerUp);
        this.sprite.setAlpha(1);
    }

    disableInteractive() {
        if (!this.isInteractive) return;
        this.isInteractive = false;
        this.sprite.disableInteractive();
        this.sprite.off("pointerover", this.onHoverStart);
        this.sprite.off("pointerout", this.onHoverEnd);
        this.sprite.off("pointerdown", this.onPointerDown);
        this.sprite.off("pointerup", this.onPointerUp);
        this.sprite.setAlpha(0.5);
    }

    onHoverStart = () => {
        if (this.tween) this.tween.stop();
        this.tween = this.scene.add.tween({
            targets: this.sprite,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100,
        });
    };

    onHoverEnd = () => {
        if (this.tween) this.tween.stop();
        this.tween = this.scene.add.tween({
            targets: this.sprite,
            scaleX: 1,
            scaleY: 1,
            duration: 100,
        });
    };

    onPointerDown = () => {
        if (this.tween) this.tween.stop();
        this.tween = this.scene.add.tween({
            targets: this.sprite,
            scaleX: 0.95,
            scaleY: 0.95,
            opacity: 0.95,
            duration: 100,
        });
        if (this.isInteractive) this.gameStore.setShopOpen(true);
    };

    onPointerUp = () => {
        if (this.tween) this.tween.stop();
        this.tween = this.scene.add.tween({
            targets: this.sprite,
            scaleX: 1.05,
            scaleY: 1.05,
            opacity: 1.0,
            duration: 100,
        });
    };

    destroy() {
        if (this.tween) this.tween.stop();
        this.sprite.destroy();
        this.proxy.removeAll();
    }
}