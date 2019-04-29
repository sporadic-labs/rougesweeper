import Loading from "./loading-scene";
import Main from "./main-scene";
import GameOverScene from "./game-over-scene";
import IsoScene from "./iso-scene";

enum SCENE_NAME {
  LOADING = "LOADING",
  MAIN = "MAIN",
  GAME_OVER = "GAME_OVER",
  ISO = "ISO"
}

/**
 * Register the scene classes to the given game using the SCENE_NAME enum values.
 */
function installScenes(game: Phaser.Game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.MAIN, Main);
  game.scene.add(SCENE_NAME.GAME_OVER, GameOverScene);
  game.scene.add(SCENE_NAME.ISO, IsoScene);
}

export { installScenes, SCENE_NAME };
