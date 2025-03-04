import { ClassType } from "./Gestae";


export interface IResourceManager {
    getResource<T extends Object>(resource: ClassType | string, defaultValue?: T | undefined): T
    setResource<T extends Object>(resource: ClassType | string, value: T): T
}

export class ResourceManager {
    private readonly _resources: Map<string, Object> = new Map<string, Object>();

    getResource<T extends Object>(key: string, defaultValue?: T | undefined): T {
        let _resource = this._resources.get(key);
        if(!_resource) _resource = defaultValue;
        return _resource as T;
    }

    setResource<T extends Object>(key: string, value: T): T {
        this._resources.set(key, value);
        return value;
    }
}