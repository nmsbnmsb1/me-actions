import { type Action, CompositeAction } from './action';
export declare class RunQueue extends CompositeAction {
    static StopHandlerManual: number;
    static StopHandlerAuto: number;
    static StopHandlerAutoAtLeastOnce: number;
    protected stopHandler: number;
    protected runCount: number;
    protected running: Action[];
    protected w: any;
    protected e: Error;
    protected toStop: boolean;
    constructor(runCount?: number, stopHandler?: number, errHandler?: number);
    setRunCount(runCount: number): this;
    setStopHandler(stopHandler: number): this;
    setToStop(): void;
    addChild(a: Action): this;
    numChildren(): number;
    protected doStart(context: any): Promise<void>;
    private next;
    private done;
    protected doStop(context: any): Promise<void>;
    addOne(a: Action): this;
    doOne(a: Action): Promise<Action>;
    stopOne(a: string | Action): Promise<void>;
    addBatch(as: Action[]): this;
    doBatch(as: Action[], errHandler?: number): Promise<Error>;
    stopBatch(as: Action[]): Promise<void>;
}
