import Loading from "./loading-scene";
import Main from "./main-scene";
import GameOverScene from "./game-over-scene";

enum SCENE_NAME {
  LOADING = "LOADING",
  MAIN = "MAIN",
  GAME_OVER = "GAME_OVER",
}

/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 *
 * @param game
 */
function installScenes(game: Phaser.Game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.MAIN, Main);
  game.scene.add(SCENE_NAME.GAME_OVER, GameOverScene);
}

export { installScenes, SCENE_NAME };
