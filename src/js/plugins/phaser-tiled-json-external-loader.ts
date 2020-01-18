/**
 * Modified from: https://github.com/Osmose/phaser-tiled-json-external-loader This didn't work for
 * two reasons:
 *  - The loader base path in our project ("/resources") broke the tileset path, e.g. tilesets were
 *    loaded from "resources/resources/maps/etc".
 *  - If two tilemaps tried to load the same tileset, one would silently fail. Phaser won't add two
 *    files with the same key.
 * The hacky changes to fix these issues are denoted in line.
 */

import Phaser, { Loader, Plugins } from "phaser";

declare module "phaser" {
  namespace Loader {
    interface LoaderPlugin {
      tilemapTiledJSONExternal(key: string, url: string): void;
    }
  }
}

export default class PhaserTiledExternalTilesetPlugin extends Plugins.BasePlugin {
  init() {
    Loader.FileTypesManager.register("tilemapTiledJSONExternal", function(
      this: Loader.LoaderPlugin,
      key: string,
      url: string
    ) {
      const multifile = new TiledFile(this, key, url);
      this.addFile(multifile.files);
    });
  }
}

class TiledFile extends Loader.MultiFile {
  // TODO: Add XHR settings for tilemap and tileset
  constructor(loader: Loader.LoaderPlugin, key: string, tilemapURL: string) {
    const tilemapFile = new Loader.FileTypes.JSONFile(loader, key, tilemapURL);
    super(loader, "tilemapJSON", key, [tilemapFile]);
  }

  onFileComplete(file: Loader.File) {
    const index = this.files.indexOf(file);
    if (index !== -1) {
      this.pending--;

      // Look for tilesets to load.
      if (file.type === "json" && file.data.tilesets) {
        const tilesets = file.data.tilesets;
        const { loader } = this;
        const path = loader.path;

        for (const [index, tileset] of tilesets.entries()) {
          if (!tileset.source) continue;

          // Tileset is relative to the tilemap filename, so we abuse URL to get the relative path.
          const url = new URL(file.src, "http://example.com");
          url.pathname += `/../${tileset.source}`;
          let tilesetUrl = url.pathname.slice(1);

          // Remove the loader path.
          tilesetUrl = tilesetUrl.replace(path, "");

          const tilesetFile = new Loader.FileTypes.JSONFile(
            loader,
            // CHANGE: make each tileset unique. This is inefficient.
            `_TILESET_${this.key}${tilesetUrl}`,
            tilesetUrl
          );

          tilesetFile.config.tilesetIndex = index;

          // CHANGE: use something like this, but then if the key exists, immediately add to
          // cache.
          // if (loader.keyExists(tilesetFile)) continue;

          this.addToMultiFile(tilesetFile);
          loader.addFile(tilesetFile);
        }
      }
    }
  }

  addToCache() {
    if (this.isReadyToProcess()) {
      const tilemapFile = this.files[0];
      for (const file of this.files.slice(1)) {
        const index = file.config.tilesetIndex;
        tilemapFile.data.tilesets[index] = {
          ...tilemapFile.data.tilesets[index],
          ...file.data,
          source: undefined // Avoid throwing in tilemap creator
        };
      }

      this.loader.cacheManager.tilemap.add(tilemapFile.key, {
        format: Phaser.Tilemaps.Formats.TILED_JSON,
        data: tilemapFile.data
      });

      this.complete = true;

      for (const file of this.files) {
        file.pendingDestroy();
      }
    }
  }
}
