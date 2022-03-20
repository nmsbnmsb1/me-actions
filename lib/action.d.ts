export interface IDeferer {
    p?: Promise<IResult>;
    resolve?: any;
    reject?: any;
}
export interface IContext {
    logger?: (level: string, msg: any, result?: IResult) => void;
    datas?: {
        [name: string]: any;
    };
    [name: string]: any;
}
export interface IResult {
    action: Action;
    context?: any;
    data?: any;
    err?: any;
    [name: string]: any;
}
export declare type IWatcher = (result?: IResult) => any;
export declare class Action {
    static StatusIdle: string;
    static StatusPending: string;
    static StatusResolved: string;
    static StatusRejected: string;
    static StatusStopped: string;
    static isError: (e: any) => boolean;
    static defer(): IDeferer;
    protected name: string;
    protected status: string;
    protected context?: any;
    protected result: IResult;
    protected watchers: {
        w: IWatcher;
        type: 'resolve' | 'reject' | 'finally';
    }[];
    constructor();
    setName(name: string): this;
    getName(): string;
    setContext(context: any): this;
    getContext(): any;
    getResult(): IResult;
    getStatus(): string;
    isIdle(): boolean;
    isPending(): boolean;
    isResolved(): boolean;
    isRejected(): boolean;
    isStopped(): boolean;
    watchResolved(watcher: IWatcher): this;
    watchRejected(watcher: IWatcher): this;
    watchFinally(watcher: IWatcher): this;
    watchFinallyAtFirst(watcher: IWatcher): this;
    private logErr;
    private dispatch;
    start(context?: any): this;
    protected doStart(context: any): Promise<any>;
    startAsync(context?: any): Promise<IResult>;
    stop(context?: any): this;
    protected doStop(context: any): void;
}
export declare class CompositeAction extends Action {
    protected children: Action[];
    protected handleErr: 0 | 1 | 2;
    constructor(handleErr?: 0 | 1 | 2, ...as: Action[]);
    setHandleErr(handleErr: 0 | 1 | 2): this;
    getHandleErr(): 0 | 2 | 1;
    addChild(...as: Action[]): this;
    addChildWithContext(a: Action, context: any): this;
    numChildren(): number;
    protected doStop(context: any): void;
}
