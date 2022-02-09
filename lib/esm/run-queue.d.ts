import { Action, CompositeAction, IResult, IDeferer } from './action';
export declare class RunQueue extends CompositeAction {
    protected closeMode: 'manual' | 'auto';
    protected runCount: number;
    protected running: Action[];
    protected qp: IDeferer;
    protected locked: boolean;
    protected err?: any;
    constructor(runCount?: number, closeMode?: 'manual' | 'auto', handleErr?: 0 | 1 | 2, ...as: Action[]);
    setRunCount(runCount: number): this;
    setCloseMode(closeMode: 'manual' | 'auto'): this;
    addChild(...as: Action[]): this;
    numChildren(): number;
    lock(): void;
    protected doStart(context: any): Promise<void>;
    private next;
    protected doStop(context: any): void;
    doOne(action: Action, context?: any): Promise<IResult>;
    stopOne(a: string | Action, context?: any): void;
}
