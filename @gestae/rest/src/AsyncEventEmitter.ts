import "reflect-metadata";
import { GestaeEvent, CancelableEvent } from "./GestaeEvent";

export type Listener = (event: GestaeEvent) => Promise<void | GestaeEvent> | void;

export interface ListenerItem {
    event: string | RegExp;
    method: Listener;
    once: boolean;
}

export interface IAsyncEventEmitter {
    emit(event: GestaeEvent): Promise<void>;
    emitCancelableEvent(event: CancelableEvent): Promise<boolean>;
    emitLifecycleEvent(event: GestaeEvent, uri: string): Promise<void>;
    emitCancelableLifecycleEvent(event: CancelableEvent, uri: string): Promise<boolean>;
}

export class AsyncEventEmitter implements IAsyncEventEmitter {
    constructor(private listeners: ListenerItem[] = []) {}

    /**
     * Emit an event and process its handlers sequentially.
     * @param eventName - The name of the event.
     * @param event - The event data.
     */
    async emit(event: GestaeEvent): Promise<void> {;
        if(this.listeners.length === 0) return;

        let _matched: boolean = false;
        const _remaining: ListenerItem[] = [];
        
        for(const _item of this.listeners) {
            _matched = (typeof _item.event === "string")? _item.event === event.name : _item.event.test(event.name);
            if(_matched) {
                await _item.method(event); // Ensure sequential execution
                if(!_item.once) _remaining.push(_item);
            }
        }
        // Remove all the once listeners
        this.listeners = _remaining;
    }

    async emitLifecycleEvent(event: GestaeEvent, uri: string = ""): Promise<void> {
        let _name = event.name;
        event.name = `${uri}/${_name}/OnBefore`;
        this.emit(event);
        event.name = `${uri}/${_name}/On`;
        this.emit(event);
        event.name = `${uri}/${_name}/OnAfter`;
        this.emit(event);
    }

    async emitCancelableEvent(event: CancelableEvent): Promise<boolean> {
        await this.emit(event);
        return !event.cancled;
    }

    async emitCancelableLifecycleEvent(event: CancelableEvent, uri: string = ""): Promise<boolean> {
        let _name = event.name;
        event.name = `${uri}/${_name}/OnBefore`;
        if(!await this.emitCancelableEvent(event)) return false;
        event.name = `${uri}/${_name}/On`;
        if(!await this.emitCancelableEvent(event)) return false;
        event.name = `${uri}/${_name}/OnAfter`;
        await this.emit(event);
        return true;
    }
}