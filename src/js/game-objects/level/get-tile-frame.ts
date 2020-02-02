export default function getTileFrame(levelKey: string): string {
  switch (levelKey.slice(0, 7)) {
    case "level-1":
      return "tile-hq";
    case "level-2":
      return "tile-warehouse";
    case "level-3":
      return "tile-lab";
    case "level-4":
      return "tile-skyscraper";
    case "level-5":
      return "tile-temple";
    default:
      throw Error(
        `Unrecognized level key ${levelKey} - unable to determine the corresponding tile fame name.`
      );
  }
}
