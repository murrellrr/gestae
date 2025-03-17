import { IHttpContext } from "../../http/IHttpContext";


export interface ITaskNode {
    getResourceValue<T extends {}>(context: IHttpContext, options?: Record<string, any>): Promise<T>;
};