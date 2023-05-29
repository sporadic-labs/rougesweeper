import EventProxy from "../../helpers/event-proxy";
import { Types } from "phaser";
import EventEmitter from "../../helpers/event-emitter";
import DEPTHS from "../depths";
import SoundManager from "../sound-manager";
import { AUDIO_KEYS } from "../../scenes";

const defaultOrigin = { x: 0.5, y: 0.5 } as const;
const defaultStyle = {
  fontSize: "20px",
  fontWeight: 600,
  backgroundColor: "#E5E0D6",
  color: "#3C3E42",
  padding: { left: 20, right: 20, top: 10, bottom: 10 },
} as const;
const defaultDepth = DEPTHS.HUD

export const BUTTON_EVENTS = {
  DOWN: "DOWN",
  OVER: "OVER",
  UP: "UP",
  OUT: "OUT",
} as const;

/**
 * A simple text-based button for mocking things up without needing sprites. This allows tracking of
 * button presses via the `events` property.
 * @export
 * @class Button
 */
export default class TextButton {
  public events = new EventEmitter<{
    DOWN: undefined;
    OVER: undefined;
    UP: undefined;
    OUT: undefined;
  }>();
  public text: Phaser.GameObjects.Text;

  private scene: Phaser.Scene;
  private isHovered: boolean;
  private isPressed: boolean;
  private enabled: boolean;
  private proxy: EventProxy;

  /**
   * @param {Phaser.Scene} scene
   * @param {number} x
   * @param {number} y
   */
  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    {
      origin = defaultOrigin,
      textStyle = defaultStyle,
      depth = defaultDepth
    }: {
      origin?: { x: number; y: number };
      textStyle?: Types.GameObjects.Text.TextStyle;
      depth?: number
    } = {},
    private sound: SoundManager
  ) {
    this.scene = scene;
    this.isHovered = false;
    this.isPressed = false;

    this.enabled = true;

    this.text = scene.add
      .text(x, y, text, { ...defaultStyle, ...textStyle })
      .setOrigin(origin.x, origin.y)
      .setDepth(depth)
      .setInteractive();

    this.updateTextStyle();
    this.enableInteractivity();

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  setVisible(isVisible: boolean) {
    this.text.setVisible(isVisible);
  }

  setIsHovered(isHovered: boolean) {
    this.isHovered = isHovered;
    this.updateTextStyle();
  }

  setIsPressed(isPressed: boolean) {
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
    this.enabled = true;
    this.updateTextStyle();
    this.text.on("pointerdown", this.onPointerDown, this);
    this.text.on("pointerup", this.onPointerUp, this);
    this.text.on("pointerover", this.onPointerOver, this);
    this.text.on("pointerout", this.onPointerOut, this);
  }

  disableInteractivity() {
    this.reset();
    this.enabled = false;
    this.updateTextStyle();
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
    this.enabled = true;
    this.updateTextStyle();
  }

  updateTextStyle() {
    if (!this.enabled) {
      if (this.isPressed) this.text.setAlpha(0.4);
      else if (this.isHovered) this.text.setAlpha(0.45);
      else this.text.setAlpha(0.5);
    } else {
      if (this.isPressed) this.text.setAlpha(0.8);
      else if (this.isHovered) this.text.setAlpha(0.9);
      else this.text.setAlpha(1);
    }
  }

  onPointerOver() {
    this.sound.playUI(AUDIO_KEYS.UI_HOVER)
    this.isHovered = true;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.OVER, undefined);
  }

  onPointerOut() {
    this.isHovered = false;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.OUT, undefined);
  }

  onPointerUp() {
    this.isPressed = false;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.UP, undefined);
  }

  onPointerDown() {
    this.sound.playUI(AUDIO_KEYS.UI_CLICK)
    this.isPressed = true;
    this.updateTextStyle();
    this.events.emit(BUTTON_EVENTS.DOWN, undefined);
  }

  destroy() {
    this.events.destroy();
    this.text.destroy();
    this.proxy.removeAll();
  }
}
