/**
 * Check if two arrays are equal by doing a shallow element-by-element comparison.
 */
export function arrayEqual(array1: any[], array2: any[]): boolean {
  return array1.length === array2.length && array1.every((elem, index) => elem === array2[index]);
}

/**
 * Creates a 2D array of width x height, filled with the given value.
 */
export function create2DArray(width: number, height: number, value: any): any[][] {
  return [...Array(height)].map(() => Array(width).fill(value));
}
