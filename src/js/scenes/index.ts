import Loading from "./loading-scene";
import StartScene from "./start-scene";
import Main from "./main-scene";
import GameOverScene from "./game-over-scene";
import SettingScene from "./settings-scene";

enum SCENE_NAME {
  LOADING = "LOADING",
  START = "START",
  MAIN = "MAIN",
  GAME_OVER = "GAME_OVER",
  SETTINGS = "SETTINGS",
}

/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 *
 * @param game
 */
function installScenes(game: Phaser.Game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.START, StartScene);
  game.scene.add(SCENE_NAME.MAIN, Main);
  game.scene.add(SCENE_NAME.GAME_OVER, GameOverScene);
  game.scene.add(SCENE_NAME.SETTINGS, SettingScene);
}

export { installScenes, SCENE_NAME };
