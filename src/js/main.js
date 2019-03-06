import "../css/main.scss";
import Phaser from "phaser";
import { Loading, Test, SCENE_NAME } from "./scenes";
import "./ui-app/";
import disableRightClickMenu from "./helpers/disable-right-click-menu";
// TESTING
import Level from "./game-objects/level-generator/index";

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

game.scene.add(SCENE_NAME.LOADING, Loading);
game.scene.add(SCENE_NAME.TEST, Test);
game.scene.start(SCENE_NAME.LOADING);
