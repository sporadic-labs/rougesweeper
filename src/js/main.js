import "@babel/polyfill";
import "../css/main.scss";
import Phaser from "phaser";
import { SCENE_NAME, installScenes } from "./scenes";
import disableRightClickMenu from "./helpers/disable-right-click-menu";

if (PRODUCTION) disableRightClickMenu("body");

const gameDimensions = 750;
const containerId = "game-container";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: containerId,
  width: gameDimensions,
  height: gameDimensions,
  backgroundColor: "#000",
  pixelArt: false,
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  }
});

installScenes(game);
game.scene.start(SCENE_NAME.LOADING);

// Phaser issue: if no scaleMode is specified in the config, Phaser doesn't watch the browser size
// and update coordinate system when size changes.
window.addEventListener("resize", () => game.scale.updateBounds());
