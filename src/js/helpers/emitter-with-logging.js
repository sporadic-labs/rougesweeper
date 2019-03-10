import { Events } from "phaser";
import Logger from "./logger";

/**
 * Snoop on the emitter for debugging
 */
export default class EmitterWithLogging extends Events.EventEmitter {
  constructor(key) {
    super();
    this.key = key;
  }

  emit(event, ...args) {
    let strEvt = typeof event !== "string" ? event.toString() : event;
    if (typeof event !== "string" && event.toString) {
      strEvt = event.toString();
    } else if (typeof event === "string") {
      strEvt = event;
    } else {
      strEvt = "Invalid Event Key";
    }
    Logger.log(`${this.key} Event emitted: ${strEvt}`);
    super.emit(event, ...args);
  }
}
