export const gameWidth = 1920;
export const gameHeight = 1080;
export const gameCenter = { x: gameWidth / 2, y: gameHeight / 2 };

export function fractionToX(x: number): number {
  return x * gameWidth;
}
export function fractionToY(y: number): number {
  return y * gameHeight;
}
export function fractionToXY(x: number, y: number): { x: number; y: number } {
  return { x: fractionToX(x), y: fractionToY(y) };
}
