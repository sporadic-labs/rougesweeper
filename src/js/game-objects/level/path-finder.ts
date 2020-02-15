import { js as EasyStar } from "easystarjs";
import { create2DArray } from "../../helpers/array-utils";
import logger from "../../helpers/logger";

enum LOCATION {
  WALKABLE = 0,
  UNWALKABLE = 1
}

interface Point {
  x: number;
  y: number;
}

export default class PathFinder {
  private grid: number[][];
  private easyStar: EasyStar;

  constructor(public width: number, public height: number) {
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

  setWalkableAt(x: number, y: number) {
    this.grid[y][x] = LOCATION.WALKABLE;
  }

  setUnwalkableAt(x: number, y: number) {
    this.grid[y][x] = LOCATION.UNWALKABLE;
  }

  isInBounds(x: number, y: number) {
    return x >= 0 && x < this.width && y >= 0 && y < this.height;
  }

  isWalkableAt(x: number, y: number) {
    return this.grid[y][x] === LOCATION.WALKABLE;
  }

  update() {
    this.easyStar.setGrid(this.grid);
  }

  findPath(start: Point, end: Point): Point[] {
    let path = null;
    this.easyStar.findPath(start.x, start.y, end.x, end.y, p => (path = p));
    this.easyStar.calculate();
    return path;
  }

  dump() {
    const string = this.grid.map(row => row.join(" ")).join("\n");
    logger.log(string);
  }
}
