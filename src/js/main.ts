import "core-js/stable";
import "regenerator-runtime/runtime";
import "../css/main.scss";
import Phaser, { Game } from "phaser";
import { SCENE_NAME, installScenes } from "./scenes";
import disableRightClickMenu from "./helpers/disable-right-click-menu";
import { gameWidth, gameHeight } from "./game-dimensions";
import PhaserTiledExternalTilesetPlugin from "./plugins/phaser-tiled-json-external-loader";
import { Plugin as NineSlicePlugin } from "phaser3-nineslice";

const containerId = "game-container";
const game = new Game({
  type: Phaser.AUTO,
  backgroundColor: "#a79279",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: gameWidth,
    height: gameHeight,
    parent: containerId,
  },
  plugins: {
    global: [
      {
        key: "PhaserTiledExternalTilesetPlugin",
        plugin: PhaserTiledExternalTilesetPlugin,
        start: true,
      },
      NineSlicePlugin.DefaultCfg,
    ],
  },
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
});

disableRightClickMenu(`#${containerId}`);

installScenes(game);
game.scene.start(SCENE_NAME.LOADING);
