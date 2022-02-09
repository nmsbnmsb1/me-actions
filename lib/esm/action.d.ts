export interface IDeferer {
    p?: Promise<IResult>;
    resolve?: any;
    reject?: any;
}
export interface IContext {
    logger?: (level: string, msg: any, context?: IContext, action?: Action, info?: any) => void;
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
}
export declare type IWatcher = (result?: IResult) => any;
export declare class Action {
    static StatusIdle: string;
    static StatusPending: string;
    static StatusResolved: string;
    static StatusRejected: string;
    static StatusStopped: string;
    static efn: () => void;
    static isError: (e: any) => boolean;
    static defer(): IDeferer;
    protected name: string;
    protected aliasName: string;
    protected logInfo: any;
    protected status: string;
    protected context?: any;
    protected result: IResult;
    private ep;
    constructor();
    setName(name: string): this;
    getName(): string;
    setAliasName(aliasName: string): this;
    getAliasName(): string;
    setLogInfo(info: any): this;
    getLogInfo(): any;
    setContext(context: any): this;
    getContext(): any;
    getResult(): IResult;
    getStatus(): string;
    isIdle(): boolean;
    isPending(): boolean;
    isResolved(): boolean;
    isRejected(): boolean;
    isStopped(): boolean;
    private getep;
    watchResolved(watcher: IWatcher): this;
    watchRejected(watcher: IWatcher): this;
    watchFinally(watcher: IWatcher): this;
    start(context?: any): this;
    protected doStart(context: any): Promise<any>;
    protected logErr(time: 'then' | 'catch' | 'stop'): void;
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
