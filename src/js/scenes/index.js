import Loading from "./loading-scene";
import Main from "./main-scene";

const SCENE_NAME = {
  LOADING: "LOADING",
  MAIN: "MAIN"
};

/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 *
 * @param {Phaser.Game} game
 */
function installScenes(game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.MAIN, Main);
}

export { installScenes, SCENE_NAME };
