import Phaser from "phaser";
import IsoPlugin from "phaser3-plugin-isometric/src/IsoPlugin.js";

export default class IsoScene extends Phaser.Scene {
  constructor() {
    super({ mapAdd: { isoPlugin: "iso" } });
  }

  preload() {
    this.load.scenePlugin({
      key: "IsoPlugin",
      url: IsoPlugin,
      sceneKey: "iso"
    });

    this.load.setPath("resources/");
    this.load.tilemapTiledJSON("kenney-iso-map", "maps/iso/kenney-iso-map.json");
    this.load.spritesheet("kenney-iso-tiles", "maps/iso/kenney-iso-tiles.png", {
      frameWidth: 64,
      frameHeight: 128
    });
  }

  create() {
    // const tilemap = this.add.tilemap("kenney-iso-map");

    this.iso.projector.origin.setTo(0.5, 0.1);

    // Floor tiles
    for (let x = 256; x > 0; x -= 32) {
      for (let y = 256; y > 0; y -= 32) {
        // Undefined here is for a Phaser.Group - weird plugin API choice
        this.add.isoSprite(x, y, 0, "kenney-iso-tiles", undefined, 4);
      }
    }

    // Raised orange walls
    for (let x = 256; x > 0; x -= 32) {
      this.add.isoSprite(x, 0, 0, "kenney-iso-tiles", undefined, 7);
      this.add.isoSprite(x, 256, 0, "kenney-iso-tiles", undefined, 7);
    }
  }
}
