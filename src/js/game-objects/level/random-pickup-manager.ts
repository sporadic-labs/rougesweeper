import Phaser from "phaser";
import TILE_TYPES from "./tile-types";
import { levelKeys } from "../../store/levels";

export default class RandomPickupManager {
  private pickupOrder: { [key: string]: Array<TILE_TYPES>} = {};

  constructor() {
    const pickupList = this.generatePickupList()

    levelKeys.forEach((key, i) => {
      if ((i + 1) % 3 === 0) {
        this.pickupOrder[key] = [TILE_TYPES.UPGRADE, TILE_TYPES.ALERT, ...pickupList.splice(0, 1)];
      } else {
        this.pickupOrder[key] = pickupList.splice(0, 2);
      }
    })
  }

  getPickupTypeForLevelFromKey(levelKey: string): TILE_TYPES {
    // Rotate the list...
    const pickup = this.pickupOrder[levelKey].shift();
    this.pickupOrder[levelKey].push(pickup)
    return pickup
  }

  /** Generate a list of 24 pickup tiles, where no repeated tiles are next to each other, and there are 2 of each pickup type. */
  private generatePickupList(): Array<TILE_TYPES> {
    let pickupList: Array<TILE_TYPES> = [];

    while (pickupList.length < 24) {
      let secondGroup: Array<TILE_TYPES> = Phaser.Math.RND.shuffle([
        TILE_TYPES.COMPASS,
        TILE_TYPES.EMP,
        TILE_TYPES.SNIPER,
        TILE_TYPES.AMMO,
      ]);
      while (pickupList[pickupList.length - 1] === secondGroup[0]) {
        secondGroup = Phaser.Math.RND.shuffle([
          TILE_TYPES.COMPASS,
          TILE_TYPES.EMP,
          TILE_TYPES.SNIPER,
          TILE_TYPES.AMMO,
        ]);

      }
      pickupList = [...pickupList, ...secondGroup];
    }

    return pickupList;
  }
}
