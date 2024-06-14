import { IDeferer, IWatcher } from './utils';
export declare class Action {
    protected parent: Action;
    protected context: any;
    protected name: string;
    protected status: number;
    protected data: any;
    protected error: Error;
    protected watchers: IWatcher[];
    protected rp: IDeferer;
    setContext(context: any): this;
    getContext(): any;
    setName(name: string): this;
    getName(): string;
    getFullName(ln?: string, showAll?: boolean): string;
    getData(): any;
    getError(): Error;
    isIdle(): boolean;
    isPending(): boolean;
    isResolved(): boolean;
    isRejected(): boolean;
    isStopped(): boolean;
    watch(w: IWatcher, index?: number): this;
    protected getRP(): IDeferer;
    protected endRP(resolve?: boolean, data?: any): void;
    protected logData(): void;
    protected logErr(): void;
    protected dispatch(): void;
    start(context?: any): Promise<this>;
    protected doStart(context: any): Promise<any>;
    stop(context?: any): Promise<this>;
    protected doStop(context: any): Promise<any>;
}
export declare class CompositeAction extends Action {
    protected children: Action[];
    protected errHandler: number;
    constructor(errHandler?: number);
    setErrHandler(errHandler: number): this;
    addChild(a: Action): this;
    addChildren(as: Action[]): this;
    numChildren(): number;
    protected doStop(context: any): Promise<void>;
}
