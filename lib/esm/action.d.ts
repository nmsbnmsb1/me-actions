export interface IDeferer {
    p?: Promise<IResult>;
    resolve?: any;
    reject?: any;
}
export interface IContext {
    datas?: {
        [index: string]: any;
    };
    errs?: {
        [index: string]: any;
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
    static logResult: (result: IResult) => void;
    protected id: number;
    protected name: string;
    protected status: string;
    protected context?: any;
    protected result: IResult;
    protected children?: Action[];
    private rp;
    private ep;
    constructor();
    getID(): number;
    setName(name: string): Action;
    getName(): string;
    getChildName(child: Action, childName?: string): string;
    getStatus(): string;
    isIdle(): boolean;
    isPending(): boolean;
    isStopped(): boolean;
    isResolved(): boolean;
    isRejected(): boolean;
    setContext(context: any): Action;
    getContext(): any;
    getResult(): IResult;
    addChild(...as: Action[]): Action;
    addChildWithContext(action: Action, context: any): Action;
    numChildren(): number;
    private getep;
    watchResolved(watcher: IWatcher): Action;
    watchRejected(watcher: IWatcher): Action;
    watchFinally(watcher: IWatcher): Action;
    start(context?: any): Action;
    p(): Promise<IResult>;
    startAsync(context?: any): Promise<IResult>;
    protected doStart(context: any): Promise<any>;
    stop(context?: any): Action;
    protected doStop(context: any): void;
}
