export default function getTileFrame(levelKey: string): string {
  switch (levelKey.slice(0, 8)) {
    case "level-01":
    case "level-02":
    case "level-03":
      return "tile-hq";
    case "level-04":
    case "level-05":
    case "level-06":
      return "tile-warehouse";
    case "level-07":
    case "level-08":
    case "level-09":
      return "tile-lab";
    case "level-10":
      return "tile-skyscraper";
    case "level-11":
      return "tile-temple";
    default:
      throw Error(
        `Unrecognized level key ${levelKey} - unable to determine the corresponding tile fame name.`
      );
  }
}
