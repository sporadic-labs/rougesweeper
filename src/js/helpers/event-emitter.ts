import { Events } from "phaser";

// Match EventEmitter3's signature for event names.
type EventName = string | symbol;

// Set up a generic type for callbacks, with an optional context for this.
type EventCallback<ParamType, Context = {}> = (this: Context, args: ParamType) => void;

// Create a base type for lookup from event name to event parameter.
type EventToParameter = Record<EventName, any>;

/**
 * Wrapper around Phaser's EventEmitter to enforce static typing on the events. If using with enums,
 * they must be string enums. Based on the snippets and explanations from:
 * https://rjzaworski.com/2019/10/event-emitters-in-typescript.
 *
 * @example
 * ```typescript
 * const emitter = new EventEmitter<{
 *   OnClick: { x: number; y: number; mouseButton: number };
 *   OnDoubleClick: { x: number; y: number; clickSpeed: number };
 * }>();
 *
 * emitter.on(
 *   "OnClick",
 *   function({ x, y, mouseButton }) {
 *     console.log(x, y, mouseButton);
 *     console.log(this.description);
 *   },
 *   { description: "Custom This Context... if you want." }
 * );
 *
 * emitter.emit("OnClick", { x: 10, y: 10, mouseButton: 1 });
 * ```
 */
class EventEmitter<EventMap extends EventToParameter> extends Events.EventEmitter {
  // TODO: figure out how to type this:
  // eventNames(): (string|symbol)[];

  addListener<E extends EventName & keyof EventMap, Context = {}>(
    event: E,
    fn: EventCallback<EventMap[E], Context>,
    context?: Context
  ): this {
    return super.addListener(event, fn, context);
  }

  on<E extends EventName & keyof EventMap, Context = {}>(
    event: E,
    fn: EventCallback<EventMap[E], Context>,
    context?: Context
  ): this {
    return super.on(event, fn, context);
  }

  once<E extends EventName & keyof EventMap, Context = {}>(
    event: E,
    fn: EventCallback<EventMap[E], Context>,
    context?: Context
  ): this {
    return super.once(event, fn, context);
  }

  emit<E extends EventName & keyof EventMap>(event: E, args: EventMap[E]) {
    return super.emit(event, args);
  }

  listeners<E extends EventName & keyof EventMap>(event: E): EventCallback<EventMap[E], any>[] {
    return super.listeners(event) as EventCallback<EventMap[E], any>[];
  }

  listenerCount<E extends EventName & keyof EventMap>(event: E): number {
    return super.listenerCount(event);
  }

  removeListener<E extends EventName & keyof EventMap, Context = {}>(
    event: E,
    fn: EventCallback<EventMap[E], Context>,
    context?: Context,
    once?: boolean
  ): this {
    return super.removeListener(event, fn, context, once);
  }

  off<E extends EventName & keyof EventMap, Context = {}>(
    event: E,
    fn: EventCallback<EventMap[E], Context>,
    context?: Context,
    once?: boolean
  ): this {
    return super.off(event, fn, context, once);
  }

  removeAllListeners<E extends EventName & keyof EventMap>(event?: E): this {
    return super.removeAllListeners(event);
  }
}

export default EventEmitter;
export { EventName, EventCallback, EventToParameter };
