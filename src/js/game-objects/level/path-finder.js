import { js as EasyStar } from "easystarjs";
import { create2DArray } from "../../helpers/array-utils";

const LOCATION = {
  WALKABLE: 0,
  UNWALKABLE: 1
};

export default class PathFinder {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.grid = create2DArray(width, height);
    this.easyStar = new EasyStar();
    this.easyStar.setGrid(this.grid);
    this.easyStar.setAcceptableTiles([LOCATION.WALKABLE]);
    this.easyStar.enableSync();
    this.easyStar.enableDiagonals();
  }

  setAllUnwalkable() {
    this.grid.forEach((row, y) =>
      row.forEach((col, x) => {
        this.grid[y][x] = LOCATION.UNWALKABLE;
      })
    );
  }

  setWalkableAt(x, y) {
    this.grid[y][x] = LOCATION.WALKABLE;
  }

  setUnwalkableAt(x, y) {
    this.grid[y][x] = LOCATION.UNWALKABLE;
  }

  update() {
    this.easyStar.setGrid(this.grid);
  }

  findPath(start, end) {
    let path = null;
    this.easyStar.findPath(start.x, start.y, end.x, end.y, p => (path = p));
    this.easyStar.calculate();
    return path;
  }
}
