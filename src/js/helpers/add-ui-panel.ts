import Phaser from "phaser";

export function addUIPanel({
  scene,
  x,
  y,
  width,
  height,
  shadowOffsetX,
  shadowOffsetY,
  offset,
  safeUsageOffset,
}: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Offset (width & height) from top-left to use when 9 slicing the asset
  offset: number;
  // Offset (width & height) from top-left to use when determining the safe
  // usage area - the area within the sprite that is safe for content
  safeUsageOffset?: number;
}) {
  const container = scene.add.container(x, y);
  const shadow = scene.add.nineslice(
    shadowOffsetX,
    shadowOffsetY,
    width,
    height,
    // @ts-expect-error Bad plugin types!
    { key: "all-assets", frame: "ui/shadow" },
    offset,
    safeUsageOffset
  );
  container.add(shadow);
  const panel = scene.add.nineslice(
    0,
    0,
    width,
    height,
    // @ts-expect-error Bad plugin types!
    { key: "all-assets", frame: "ui/panel" },
    offset,
    safeUsageOffset
  );
  container.add(panel);
  return container;
}
