import EventProxy from "../../helpers/event-proxy";
import store from "../../store";
import GAME_MODES from "../../game-objects/game-manager/events";
import MobXProxy from "../../helpers/mobx-proxy";

const TOGGLE_STATES = {
  UP: "UP",
  DOWN: "DOWN"
};

export default class AttackToggle {
  /**
   * @param {Phaser.Scene} scene
   */
  constructor(scene, gameStore) {
    this.scene = scene;
    const x = 116;

    this.state = TOGGLE_STATES.UP;

    this.attackCountText = scene.add.text(x, 635, "", { fontSize: 25 }).setOrigin(0.5, 0.5);

    // Makeshift button for mvp purposes.
    // TODO(rex): Probably replace this with a sprite.
    const buttonWidth = 160;
    const buttonHeight = 40;
    this.attackToggle = scene.add.container(x, 680, [
      scene.add.rectangle(0, 0, buttonWidth, buttonHeight, 0xbcbcbc, 1).setOrigin(0.5, 0.5),
      scene.add.text(0, 0, "Attack", { fontSize: 25 }).setOrigin(0.5, 0.5),
      scene.add.text(0, 0, "Cancel", { fontSize: 25 }).setOrigin(0.5, 0.5)
    ]);

    this.attackToggle.getAt(2).alpha = 0;
    this.attackToggle.setSize(buttonWidth, buttonHeight);
    this.enableInteractive();

    this.updateAttackCountText(gameStore.attackCount, true);
    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "attackCount", () => {
      this.disabled = gameStore.attackCount <= 0;
      if (this.disabled) this.disableInteractive();
      else this.enableInteractive();
      this.updateAttackCountText(gameStore.attackCount);
    });
    this.mobProxy.observe(gameStore, "gameState", () => {
      if (!this.disabled) {
        if (gameStore.gameState === GAME_MODES.MENU_MODE) {
          this.disableInteractive();
        } else {
          this.enableInteractive();
        }
      }
      if (gameStore.gameState === GAME_MODES.MOVE_MODE) {
        this.state = TOGGLE_STATES.UP;
        this.attackToggle.getAt(1).alpha = 1;
        this.attackToggle.getAt(2).alpha = 0;
      }
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  updateAttackCountText(attackCount) {
    this.attackCountText.setText(`Attack: ${attackCount}/3`);
  }

  enableInteractive() {
    if (this.isInteractive) return;
    this.isInteractive = true;
    this.attackToggle.setInteractive();
    this.attackToggle.on("pointerover", this.onHoverStart);
    this.attackToggle.on("pointerout", this.onHoverEnd);
    this.attackToggle.on("pointerdown", this.onPointerDown);
    this.attackToggle.on("pointerup", this.onPointerUp);
    this.attackToggle.setAlpha(1);
  }

  disableInteractive() {
    if (!this.isInteractive) return;
    this.isInteractive = false;
    this.attackToggle.disableInteractive();
    this.attackToggle.off("pointerover", this.onHoverStart);
    this.attackToggle.off("pointerout", this.onHoverEnd);
    this.attackToggle.off("pointerdown", this.onPointerDown);
    this.attackToggle.off("pointerup", this.onPointerUp);
    this.attackToggle.setAlpha(0.5);
  }

  onHoverStart = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.attackToggle,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 100
    });
    // this.events.emit(ATTACK_TOGGLE_EVENTS.BUTTON_OVER, this);
  };

  onHoverEnd = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.attackToggle,
      scaleX: 1,
      scaleY: 1,
      duration: 100
    });
    // this.events.emit(ATTACK_TOGGLE_EVENTS.BUTTON_OUT, this);
  };

  onPointerDown = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.attackToggle,
      scaleX: 0.95,
      scaleY: 0.95,
      opacity: 0.95,
      duration: 100
    });
    this.toggle();
    // this.events.emit(ATTACK_TOGGLE_EVENTS.BUTTON_SELECT, this);
  };

  onPointerUp = () => {
    if (this.tween) this.tween.stop();
    this.tween = this.scene.add.tween({
      targets: this.attackToggle,
      scaleX: 1.05,
      scaleY: 1.05,
      opacity: 1.0,
      duration: 100
    });
  };

  toggle() {
    switch (this.state) {
      case TOGGLE_STATES.UP:
        this.state = TOGGLE_STATES.DOWN;
        this.attackToggle.getAt(1).alpha = 0;
        this.attackToggle.getAt(2).alpha = 1;
        this.attackToggle.alpha = 0.95;
        store.setGameState(GAME_MODES.ATTACK_MODE);
        break;
      case TOGGLE_STATES.DOWN:
        this.state = TOGGLE_STATES.UP;
        this.attackToggle.getAt(1).alpha = 1;
        this.attackToggle.getAt(2).alpha = 0;
        this.attackToggle.alpha = 1.0;
        store.setGameState(GAME_MODES.MOVE_MODE);
        break;
    }
  }

  destroy() {
    this.mobProxy.destroy();
    if (this.tween) this.tween.stop();
    this.attackCountText.destroy();
    this.attackToggle.destroy();
    this.proxy.removeAll();
  }
}
