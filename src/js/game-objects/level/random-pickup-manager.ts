import Phaser from "phaser";
import TILE_TYPES from "./tile-types";
import { levelKeys } from "../../store/levels"

export default class RandomPickupManager {
  private pickupOrder: Array<TILE_TYPES>

  constructor() {
    /*
     * Generate a list of 9 pickup tiles, where no repeated tiles are next to each other, and there are 2 of each pickup type.
     */
    const firstGroup = Phaser.Math.RND.shuffle([TILE_TYPES.COMPASS, TILE_TYPES.EMP, TILE_TYPES.SNIPER])
    let secondGroup: Array<TILE_TYPES> = Phaser.Math.RND.shuffle([TILE_TYPES.COMPASS, TILE_TYPES.EMP, TILE_TYPES.SNIPER])
    while (firstGroup[2] === secondGroup[0]) {
      secondGroup = Phaser.Math.RND.shuffle([TILE_TYPES.COMPASS, TILE_TYPES.EMP, TILE_TYPES.SNIPER])
    }

    this.pickupOrder = [
      firstGroup[0],
      firstGroup[1],
      TILE_TYPES.ALERT_AMMO,
      firstGroup[2],
      secondGroup[0],
      TILE_TYPES.ALERT_AMMO,
      secondGroup[1],
      secondGroup[2],
      TILE_TYPES.ALERT_AMMO,
    ]
  }

  getPickupTypeForLevel(levelIndex: number): TILE_TYPES {
    return this.pickupOrder[levelIndex]
  }

  getPickupTypeForLevelFromKey(levelKey: string): TILE_TYPES {
    const levelIndex = levelKeys.findIndex(key => key === levelKey)
    return this.pickupOrder[levelIndex]
  }
}
