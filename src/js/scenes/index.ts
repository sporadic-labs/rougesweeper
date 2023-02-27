import Loading from "./loading-scene";
import StartScene from "./start-scene";
import Main from "./main-scene";
import WinScene from "./win-scene";
import LoseScene from "./lose-scene";

enum SCENE_NAME {
  LOADING = "LOADING",
  START = "START",
  MAIN = "MAIN",
  WIN = "WIN",
  LOSE = "LOSE",
}

/** Register the scene classes to the given game using the SCENE_NAME enum values. */
function installScenes(game: Phaser.Game) {
  game.scene.add(SCENE_NAME.LOADING, Loading);
  game.scene.add(SCENE_NAME.START, StartScene);
  game.scene.add(SCENE_NAME.MAIN, Main);
  game.scene.add(SCENE_NAME.WIN, WinScene);
  game.scene.add(SCENE_NAME.LOSE, LoseScene);
}

enum AUDIO_KEYS {
  MAIN_MENU_MUSIC = "main-menu-music",
  LEVEL_MUSIC = "level-music",
  TILE_PLACE = "tile-place",
  TILE_PICKUP = "tile-pickup",
  TILE_HIT = "tile-hit",
  INVALID_MOVE = "invalid-move",
  WEAPON_HACK = "weapon-hack",
  PLAYER_MOVE = "player-move",
}

enum AUDIO_TYPES {
  BACKGROUND_MUSIC = "background-music",
  SFX = "sfx",
}

const audioData: Array<{
  key: AUDIO_KEYS;
  path: string;
  type: AUDIO_TYPES;
  options: Phaser.Types.Sound.SoundConfig;
}> = [
  // Music
  {
    key: AUDIO_KEYS.MAIN_MENU_MUSIC,
    path: "music/2019-12-09_-_Retro_Forest_-_David_Fesliyan.mp3",
    type: AUDIO_TYPES.BACKGROUND_MUSIC,
    options: {},
  },
  {
    key: AUDIO_KEYS.LEVEL_MUSIC,
    path: "music/SLOWEST-TEMPO2019-12-11_-_Retro_Platforming_-_David_Fesliyan.mp3",
    type: AUDIO_TYPES.BACKGROUND_MUSIC,
    options: {},
  },
  // Gameplay
  {
    key: AUDIO_KEYS.TILE_PLACE,
    path: "gameplay/cardPlace2.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
  {
    key: AUDIO_KEYS.INVALID_MOVE,
    path: "gameplay/error_006.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
  // Weapons
  {
    key: AUDIO_KEYS.WEAPON_HACK,
    path: "weapons/laserSmall_003.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
  // Pickups
  {
    key: AUDIO_KEYS.TILE_PICKUP,
    path: "pickups/powerUp7.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
  {
    key: AUDIO_KEYS.TILE_HIT,
    path: "pickups/impactWood_light_002.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
  // Player
  {
    key: AUDIO_KEYS.PLAYER_MOVE,
    path: "player/cardShove2.ogg",
    type: AUDIO_TYPES.SFX,
    options: {},
  },
];

/**
 * Register the audio files to the given game using the AUDIO_KEYS enum values.
 * TODO(rex): Investigate Audiosprites
 */
function loadAudio(scene: Phaser.Scene) {
  scene.load.setPath("resources/audio/"); // set the initial path

  audioData.forEach((data) => {
    scene.load.audio(data.key, data.path);
  });

  scene.load.setPath(); // reset the path
}

/** Add the relevant audio files to a scene. */
function addAudio(scene: Phaser.Scene) {
  scene.load.setPath("resources/audio/"); // set the initial path

  audioData.forEach((data) => {
    try {
      scene.sound.add(data.key, data.options);
    } catch (err) {
      console.log(data)
      console.log(err)
    }
  });

  scene.load.setPath(); // reset the path
}

export { installScenes, SCENE_NAME, AUDIO_KEYS, loadAudio, addAudio };
