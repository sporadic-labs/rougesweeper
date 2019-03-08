import "../css/main.scss";
import Phaser from "phaser";
import { SCENE_NAME, installScenes } from "./scenes";
import "./ui-app/";
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
