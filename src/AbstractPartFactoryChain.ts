import { IApplicationContext } from "./ApplicationContext";
import { GestaeError } from "./GestaeError";
import { ILogger } from "./Logger";
import { AbstractPart } from "./Part";

export type FactoryReturnType<O extends Object, P extends AbstractPart<O>> = {
    top: P;
    bottom?: P;
};

export abstract class AbstractPartFactoryChain<O extends Object, P extends AbstractPart<O>> {
    protected          context: IApplicationContext;
    protected readonly log:     ILogger;
    private            link?:   AbstractPartFactoryChain<any, any>;

    constructor(context: IApplicationContext, link?: AbstractPartFactoryChain<any, any>) {
        this.context = context;
        this.log = this.context.log.child({name: this.constructor.name});
        this.link = link;
    }

    add(link: AbstractPartFactoryChain<any, any>) {
        if(!this.link) this.link = link;
        else this.link.add(link);
    }

    abstract isPartFactory(part: any): boolean;

    abstract _create(part: any): FactoryReturnType<O, P>;

    create(part: any): FactoryReturnType<O, P> {
        if(this.isPartFactory(part)) 
            return this._create(part);
        else if(this.link) 
            return this.link.create(part);
        else 
            throw GestaeError.toError("Cannot create part for target.");
    }
}