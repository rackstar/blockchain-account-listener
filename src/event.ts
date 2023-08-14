import { EventEmitter } from "events";
import * as consoleLog from "console-log-level";
import {
  EventEmitterOptions,
  EventListener,
  EventName,
  EventObject,
} from "./types";
import { inspect } from "./utils";

/**
 * Thin wrapper around EventEmitter to add logs for .on and .emit methods
 */
interface IEvent {
  onEvent: (eventName: EventName, listener: EventListener) => void;
  emitEvent: (eventObject: EventObject) => boolean;
}

export default class Event extends EventEmitter implements IEvent {
  private readonly log: consoleLog.Logger;

  constructor(logger: consoleLog.Logger, options?: EventEmitterOptions) {
    super(options);
    this.log = logger;
  }

  /**
   * Subscribes the given listener function to the given event name
   * @param eventName
   * @param listener
   */
  public onEvent = (eventName: EventName, listener: EventListener): void => {
    this.log.debug(
      `subscribe(eventName: ${eventName}, listener: ${listener.toString()})`,
    );
    this.on(eventName, listener);
    this.log.info(`Listening to ${eventName} events...`);
  };

  /**
   * Emits the given event to all subscriber of the given event
   * @param eventName
   * @param eventObject
   */
  public emitEvent(eventObject: EventObject): boolean {
    this.log.debug(`emit(event: ${inspect(eventObject)})`);
    const success = this.emit(eventObject.name, eventObject.event);
    if (success) {
      this.log.debug(
        `Successfully emitted ${eventObject.name} ${inspect(
          eventObject.event,
        )})`,
      );
    } else {
      this.log.warn(`event: ${eventObject.name} has no listeners!`);
    }
    return success;
  }
}
