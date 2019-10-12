import "core-js/stable";
import "regenerator-runtime/runtime";
import "../css/main.scss";
import Phaser from "phaser";
import { SCENE_NAME, installScenes } from "./scenes";
import disableRightClickMenu from "./helpers/disable-right-click-menu";
import { gameWidth, gameHeight } from "./game-dimensions";

if (PRODUCTION) disableRightClickMenu("body");

const containerId = "game-container";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: "#a79279",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameWidth,
    height: gameHeight,
    parent: containerId
  },
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
