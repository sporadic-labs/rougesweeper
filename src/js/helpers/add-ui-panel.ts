import Phaser from "phaser";

/**
 * Shadows are weird - we want a smaller offset, but a lighter shadow when the
 * shadow is in the HUD, so use a type here to control that.
 */
export type Shadow = "dialogue" | "hud";

export function addUIPanel({
  scene,
  x,
  y,
  width,
  height,
  shadow,
  offset,
  safeUsageOffset,
}: {
  scene: Phaser.Scene;
  x: number;
  y: number;
  width: number;
  height: number;
  shadow: Shadow;
  // Offset (width & height) from top-left to use when 9 slicing the asset
  offset: number;
  // Offset (width & height) from top-left to use when determining the safe
  // usage area - the area within the sprite that is safe for content
  safeUsageOffset?: number;
}) {
  const shadowOffset = shadow === "dialogue" ? 15 : 10;
  const shadowAlpha = shadow === "dialogue" ? 1 : 0.5;

  const container = scene.add.container(x, y);
  const shadowPanel = scene.add.nineslice(
    shadowOffset,
    shadowOffset,
    width,
    height,
    // @ts-expect-error Bad plugin types!
    { key: "all-assets", frame: "ui/shadow" },
    offset,
    safeUsageOffset
  );
  shadowPanel.setAlpha(shadowAlpha);
  container.add(shadowPanel);
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
