import { IApplicationContext } from "./ApplicationContext";
import { ILogger } from "./Logger";
import { AbstractPart } from "./Part";



export abstract class AbstractFeatureFactoryChain<P extends AbstractPart<any>> {
    protected context: IApplicationContext;
    protected log:      ILogger;
    private   _link?: AbstractFeatureFactoryChain<any>;
    
    constructor(context: IApplicationContext, link?: AbstractFeatureFactoryChain<any>) {
        this.context = context;
        this._link = link;
        this.log = this.context.log.child({name: this.constructor.name});
    }

    add(link: AbstractFeatureFactoryChain<any>) {
        if(!this._link) this._link = link;
        else this._link.add(link);
    }

    abstract isFeatureFactory<T extends Object>(part: P, target: T): boolean;

    abstract _apply<T extends Object>(part: P, target: T): void;

    apply<T extends Object>(part: P, target: T): void {
        if(this.isFeatureFactory(part, target))
            this._apply(part, target);
        
        if(this._link) 
            this._link.apply(part, target);
    }
}