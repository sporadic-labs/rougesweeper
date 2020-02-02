export default function getTilesetName(levelKey: string): string {
  const levelKeyParts = levelKey.split("-");
  switch (levelKeyParts[1]) {
    case "1":
      return "hq";
    case "2":
      return "warehouse";
    case "3":
      return "lab";
    case "4":
      return "skyscraper";
    case "5":
      return "temple";
    default:
      throw Error(
        `Unrecognized level key ${levelKey} - unable to determine the corresponding tileset name.`
      );
  }
}
