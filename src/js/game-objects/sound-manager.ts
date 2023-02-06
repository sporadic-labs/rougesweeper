/*
 * Sound Manager.
 */

import { Sound, Scene, Types } from "phaser";
import EventProxy from "../helpers/event-proxy";
import { GameStore } from "../store/index";
import storedSettings from "../store/stored-settings";
import { addAudio } from "../scenes/index";
import MobXProxy from "../helpers/mobx-proxy";

export default class SoundManager {
  private proxy: EventProxy;
  private mobProxy: MobXProxy;

  private audio: Sound.BaseSoundManager

  private sfxVolume: number;
  private musicVolume: number;
  private isMuted: boolean;

  constructor(scene: Scene, gameStore: GameStore) {
    this.audio = scene.sound;

    /* Add sound fx needed for game. */
    addAudio(scene)

    // this.mobProxy = new MobXProxy();
    // this.mobProxy.observe(storedSettings, "sfxVolume", () => {
    //   console.log("volume changing...")
    // });

    this.proxy = new EventProxy();
    this.proxy.on(scene.events, "shutdown", this.destroy, this);
    this.proxy.on(scene.events, "destroy", this.destroy, this);
  }

  play(key: string, opts?: Types.Sound.SoundConfig | Types.Sound.SoundMarker): boolean {
    return this.audio.play(key, opts)
  }

  pauseAll(): void {
    return this.audio.pauseAll()
  }

  stopByKey(key: string): number {
    return this.audio.stopByKey(key)
  }

  destroy() {
    this.audio.stopAll();
    // this.mobProxy.destroy();
    this.proxy.removeAll();
    
    // NOTE(rex): What else needs to be reset here...?
  }
}
