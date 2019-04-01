import EventProxy from "../../helpers/event-proxy";
import { Events } from "phaser";

const defaultOrigin = { x: 0.5, y: 0.5 };
const defaultStyle = {
  fontSize: 20,
  fontWeight: 600,
  backgroundColor: "#E5E0D6",
  fill: "#3C3E42",
  padding: { left: 20, right: 20, top: 10, bottom: 10 }
};

export const BUTTON_EVENTS = {
  DOWN: "DOWN",
  OVER: "OVER",
  UP: "UP",
  OUT: "OUT"
};

/**
 * A simple text-based button for mocking things up without needing sprites. This allows tracking of
 * button presses via the `events` property.
 * @export
 * @class Button
 */
export default class TextButton {
  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(scene, x, y, text, { origin = defaultOrigin, textStyle = defaultStyle } = {}) {
    this.scene = scene;
    this.isHovered = false;
    this.isPressed = false;
    this.events = new Events.EventEmitter();

    this.text = scene.add
      .text(x, y, text, textStyle)
      .setOrigin(origin.x, origin.y)
      .setInteractive();

    this.updateTextStyle();
    this.enableInteractivity();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  setVisible(isVisible) {
    this.text.setVisible(isVisible);
  }

  setIsHovered(isHovered) {
    this.isHovered = isHovered;
    this.updateTextStyle();
  }

  setIsPressed(isPressed) {
    this.isPressed = isPressed;
    this.updateTextStyle();
  }

  hitTest() {
    // Ugh, this feels a bit leaky & expensive as an abstraction, but it's all I can find in Phaser
    return (
      this.scene.game.input.hitTest(
        this.scene.input.activePointer,
        [this.text],
        this.scene.cameras.main
      ).length === 1
    );
  }

  enableInteractivity() {
    this.isHovered = this.hitTest();
    this.isPressed = false;
    this.updateTextStyle();
    this.text.on("pointerdown", this.onPointerDown, this);
    this.text.on("pointerup", this.onPointerUp, this);
    this.text.on("pointerover", this.onPointerOver, this);
    this.text.on("pointerout", this.onPointerOut, this);
  }

  disableInteractivity() {
    this.reset();
    this.text.off("pointerdown", this.onPointerDown, this);
    this.text.off("pointerup", this.onPointerUp, this);
    this.text.off("pointerover", this.onPointerOver, this);
    this.text.off("pointerout", this.onPointerOut, this);
  }

  /**
   * Reset the internal state of the button to not hovered and not pressed. This is useful in edge
   * cases, e.g. when the game is paused immediately when a button is pressed.
   * @memberof Button
   */
  reset() {
    this.isHovered = false;
    this.isPressed = false;
    this.updateTextStyle();
  }

  updateTextStyle() {
    if (this.isPressed) this.text.setAlpha(0.8);
    else if (this.isHovered) this.text.setAlpha(0.9);
    else this.text.setAlpha(1);
  }

  onPointerOver() {
    this.isHovered = true;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.OVER);
  }

  onPointerOut() {
    this.isHovered = false;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.OUT);
  }

  onPointerUp() {
    this.isPressed = false;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.UP);
  }

  onPointerDown() {
    this.isPressed = true;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.DOWN);
  }

  destroy() {
    this.events.destroy();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
