import EventProxy from "../../helpers/event-proxy";
import { GameStore } from "../../store";
import TextButton from "./text-button";
import DEPTHS from "../depths";
import TweenPoser from "../components/tween-poser";

const baseTextStyle = {
  align: "center",
  fill: "#ffffff"
};
const itemTextStyle = {
  ...baseTextStyle,
  lineSpacing: 8,
  fontSize: 22
};

type FadePoses = "FadeOut" | "FadeIn";

export default class ShopButtons {
  scene: Phaser.Scene;
  gameStore: GameStore;
  sprite: Phaser.GameObjects.Sprite;
  button: TextButton;
  text: Phaser.GameObjects.Text;
  active: boolean;
  container: Phaser.GameObjects.Container;
  buttonFadePoser: TweenPoser<FadePoses>;
  proxy: EventProxy;
  cb: Function;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    texture: string,
    frame: string,
    buttonLabel: string,
    message: string,
    cb: Function
  ) {
    this.scene = scene;
    this.cb = cb;

    this.active = true;

    const sprite = scene.add.sprite(0, -104, texture, frame);
    this.sprite = sprite;
    const text = scene.add.text(0, 0, message, itemTextStyle).setOrigin(0.5, 0.5);
    this.text = text;
    const button = new TextButton(scene, 0, 96, buttonLabel);
    button.events.on("DOWN", this.onButtonPress);
    this.button = button;

    this.container = scene.add.container(x, y, [sprite, text, button.text]).setDepth(DEPTHS.MENU);

    this.buttonFadePoser = new TweenPoser(scene, this.button, { duration: 100 });
    this.buttonFadePoser.definePoses({
      FadeIn: { alpha: 1 },
      FadeOut: { alpha: 0.6 }
    });
    this.buttonFadePoser.setToPose("FadeOut");

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  onButtonPress = () => {
    if (this.active && this.cb) this.cb(this);
  };

  enable() {
    this.active = true;
    this.buttonFadePoser.moveToPose("FadeIn");
    this.button.enableInteractivity();
  }

  disable() {
    this.active = false;
    this.buttonFadePoser.moveToPose("FadeOut");
    this.button.disableInteractivity();
  }

  reset() {
    this.button.reset();
  }

  destroy() {
    this.button.destroy();
    this.text.destroy();
    this.sprite.destroy();
    this.container.destroy();
    this.proxy.removeAll();
  }
}
