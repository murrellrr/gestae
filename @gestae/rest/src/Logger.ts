import pino from "pino";

export interface ILogger {
    log(message: string, ...optionalParams: any[]): void;
    info(message: string, ...optionalParams: any[]): void;
    warn(message: string, ...optionalParams: any[]): void;
    error(message: string, ...optionalParams: any[]): void;
    debug(message: string, ...optionalParams: any[]): void; // Optional for debug logs
    child(context?: object): ILogger;
}



export class DefaultLogger implements ILogger {
    private static instance: DefaultLogger; // Singleton instance

    private readonly logger;

    constructor(base: pino.Logger) {
        this.logger = base;
    }

    /**
     * Get the global instance of the logger.
     */
    public static getInstance(context: object = {app: "root"}): DefaultLogger {
        if(!DefaultLogger.instance)
            DefaultLogger.instance = new DefaultLogger(pino({
                level: "debug",
                transport: {
                    target: "pino-pretty",
                },
                base: context
            }));
        return DefaultLogger.instance;
    }

    log(message: string, ...optionalParams: any[]): void {
        this.logger.info(message, ...optionalParams);
    }

    info(message: string, ...optionalParams: any[]): void {
        this.logger.info(message, ...optionalParams);
    }

    warn(message: string, ...optionalParams: any[]): void {
        this.logger.warn(message, ...optionalParams);
    }

    error(message: string, ...optionalParams: any[]): void {
        this.logger.error(message, ...optionalParams);
    }

    debug(message: string, ...optionalParams: any[]): void {
        this.logger.debug(message, ...optionalParams);
    }

    /**
     * Creates a child logger, appending its name to the hierarchical logger string.
     */
    child(context: object = {app: "root"}): ILogger {
        const _child = this.logger.child(context);
        return new DefaultLogger(_child);
    }
}

export function createLogger(context: object = {app: "root"}): ILogger {
    return DefaultLogger.getInstance(context);
}