import { js as EasyStar } from "easystarjs";

export default class PathFinder {
  constructor(grid, acceptableTiles) {
    this.easyStar = new EasyStar();
    this.easyStar.setGrid(grid);
    this.easyStar.setAcceptableTiles(acceptableTiles);
    this.easyStar.enableSync();
  }

  findPath(start, end) {
    let path = null;
    this.easyStar.findPath(start.x, start.y, end.x, end.y, p => (path = p));
    this.easyStar.calculate();
    return path;
  }
}
