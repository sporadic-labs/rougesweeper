/**
 * Modified from: https://github.com/Osmose/phaser-tiled-json-external-loader This didn't work for
 * two reasons:
 *  - The loader base path in our project ("/resources") broke the tileset path, e.g. tilesets were
 *    loaded from "resources/resources/maps/etc".
 *  - If two tilemaps tried to load the same tileset, one would silently fail. Phaser won't add two
 *    files with the same key.
 * The hacky changes to fix these issues are denoted in line.
 */

export default function registerTiledJSONExternalLoader(Phaser: any) {
  const FileTypesManager = Phaser.Loader.FileTypesManager;
  const GetFastValue = Phaser.Utils.Objects.GetFastValue;
  const IsPlainObject = Phaser.Utils.Objects.IsPlainObject;
  const JSONFile = Phaser.Loader.FileTypes.JSONFile;
  const MultiFile = Phaser.Loader.MultiFile;

  class TiledJSONExternalFile extends MultiFile {
    constructor(
      loader: any,
      key: any,
      tilemapURL?: any,
      path?: any,
      baseURL?: any,
      tilemapXhrSettings?: any,
      tilesetXhrSettings?: any
    ) {
      if (IsPlainObject(key)) {
        const config = key;

        key = GetFastValue(config, "key");
        tilemapURL = GetFastValue(config, "url");
        tilemapXhrSettings = GetFastValue(config, "xhrSettings");
        path = GetFastValue(config, "path");
        baseURL = GetFastValue(config, "baseURL");
        tilesetXhrSettings = GetFastValue(config, "tilesetXhrSettings");
      }

      const tilemapFile = new JSONFile(loader, key, tilemapURL, tilemapXhrSettings);
      super(loader, "tilemapJSON", key, [tilemapFile]);

      this.config.path = path;
      this.config.baseURL = baseURL;
      this.config.tilesetXhrSettings = tilesetXhrSettings;
    }

    onFileComplete(file: any) {
      const index = this.files.indexOf(file);
      if (index !== -1) {
        this.pending--;

        if (file.type === "json" && file.data.hasOwnProperty("tilesets")) {
          //  Inspect the data for the files to now load
          const tilesets = file.data.tilesets;

          const config = this.config;
          const loader = this.loader;

          const currentBaseURL = loader.baseURL;
          const currentPath = loader.path;
          const currentPrefix = loader.prefix;

          const baseURL = GetFastValue(config, "baseURL", currentBaseURL);
          const path = GetFastValue(config, "path", currentPath);
          const prefix = GetFastValue(config, "prefix", currentPrefix);
          const tilesetXhrSettings = GetFastValue(config, "tilesetXhrSettings");

          loader.setBaseURL(baseURL);
          loader.setPath(path);
          loader.setPrefix(prefix);

          for (const [index, tileset] of tilesets.entries()) {
            if (!tileset.source) {
              continue;
            }

            // Tileset is relative to the tilemap filename, so we abuse URL to
            // get the relative path.
            const url = new URL(file.src, "http://example.com");
            url.pathname += `/../${tileset.source}`;
            let tilesetUrl = url.pathname.slice(1);

            tilesetUrl = tilesetUrl.replace(currentPath, "");

            const tilesetFile = new JSONFile(
              loader,
              // CHANGE: make each tileset unique. This is inefficient.
              `_TILESET_${this.key}${tilesetUrl}`,
              tilesetUrl,
              tilesetXhrSettings
            );

            tilesetFile.tilesetIndex = index;

            // CHANGE: use something like this, but then if the key exists, immediately add to
            // cache.
            // if (loader.keyExists(tilesetFile)) continue;

            this.addToMultiFile(tilesetFile);
            loader.addFile(tilesetFile);
          }

          //  Reset the loader settings
          loader.setBaseURL(currentBaseURL);
          loader.setPath(currentPath);
          loader.setPrefix(currentPrefix);
        }
      }
    }

    addToCache() {
      if (this.isReadyToProcess()) {
        const tilemapFile = this.files[0];
        for (const file of this.files.slice(1)) {
          const index = file.tilesetIndex;
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

  FileTypesManager.register("tilemapTiledJSONExternal", function(
    key: any,
    tilemapURL: any,
    path: any,
    baseURL: any,
    tilemapXhrSettings: any
  ) {
    //  Supports an Object file definition in the key argument
    //  Or an array of objects in the key argument
    //  Or a single entry where all arguments have been defined

    if (Array.isArray(key)) {
      for (var i = 0; i < key.length; i++) {
        const multifile = new TiledJSONExternalFile(this, key[i]);
        this.addFile(multifile.files);
      }
    } else {
      const multifile = new TiledJSONExternalFile(
        this,
        key,
        tilemapURL,
        path,
        baseURL,
        tilemapXhrSettings
      );
      this.addFile(multifile.files);
    }

    return this;
  });
}
