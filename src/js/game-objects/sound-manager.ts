/*
 * Sound Manager.
 */

import { Sound, Scene, Types } from "phaser";
import EventProxy from "../helpers/event-proxy";
import { GameStore } from "../store/index";
import storedSettings from "../store/stored-settings";
import { addAudio, AUDIO_KEYS } from "../scenes/index";
import MobXProxy from "../helpers/mobx-proxy";

export default class SoundManager {
  private proxy: EventProxy;
  private mobProxy: MobXProxy;

  private audio: Sound.BaseSoundManager;

  private sfxVolume: number;
  private musicVolume: number;
  private isMuted: boolean;

  private gameStore: GameStore;

  constructor(scene: Scene, gameStore: GameStore) {
    this.audio = scene.sound;
    this.gameStore = gameStore;

    this.musicVolume = gameStore.musicVolume;
    this.sfxVolume = gameStore.sfxVolume;
    this.isMuted = gameStore.muted;

    /* Add sound fx needed for game. */
    addAudio(scene);

    // Setup Observables.
    this.mobProxy = new MobXProxy();
    this.mobProxy.observe(gameStore, "musicVolume", () => {
      this.musicVolume = gameStore.musicVolume;
    });
    this.mobProxy.observe(gameStore, "sfxVolume", () => {
      this.sfxVolume = gameStore.sfxVolume;
    });
    this.mobProxy.observe(gameStore, "muted", () => {
      this.isMuted = gameStore.muted;
    });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  play(key: string, opts?: Types.Sound.SoundConfig | Types.Sound.SoundMarker): boolean {
    return this.audio.play(key, opts);
  }

  playSfx(key: string, opts?: Types.Sound.SoundConfig | Types.Sound.SoundMarker): boolean {
    const volume = this.sfxVolume / 10
    const defaultOpts = opts ?? {};
    return this.play(key, { ...defaultOpts, volume });
  }

  playMusic(key: string, opts?: Types.Sound.SoundConfig | Types.Sound.SoundMarker): boolean {
    const volume = this.musicVolume / 10
    const defaultOpts = opts ?? {};
    return this.play(key, { ...defaultOpts, volume });
  }

  pauseAll(): void {
    return this.audio.pauseAll();
  }

  stopByKey(key: string): number {
    return this.audio.stopByKey(key);
  }

  destroy() {
    this.audio.stopAll();
    this.mobProxy.destroy();
    this.proxy.removeAll();

    // NOTE(rex): What else needs to be reset here...?
  }
}
