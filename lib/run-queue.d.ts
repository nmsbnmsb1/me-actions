import { Action, IDeferer, IResult } from './action';
export declare class RunQueue extends Action {
    protected closeMode: 'manual' | 'auto';
    protected ignoreErr: boolean;
    protected breakWhenErr: boolean;
    protected runCount: number;
    protected running: Action[];
    protected locked: boolean;
    protected qp: IDeferer;
    protected err?: any;
    constructor(runCount?: number, closeMode?: 'manual' | 'auto', ignoreErr?: boolean, breakWhenErr?: boolean, ...as: Action[]);
    setRunCount(runCount: number): RunQueue;
    setCloseMode(closeMode: 'manual' | 'auto'): RunQueue;
    setIgnoreErr(ignoreErr: boolean): RunQueue;
    setBreakWhenErr(breakWhenErr: boolean): RunQueue;
    numChildren(): number;
    addChild(...as: Action[]): RunQueue;
    lock(): void;
    isLocked(): boolean;
    protected doStart(context: any): Promise<void | IResult>;
    private next;
    protected doStop(context: any): Promise<void>;
    do(action: Action, context?: any): Promise<any>;
    stopOne(a: number | string | Action, context?: any): void;
}
