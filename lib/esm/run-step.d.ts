import { Action } from './action';
import { RunQueue } from './run-queue';
export declare type IHandlerFactory = (i: number, stepOptions: {
    from: number;
    to: number;
    count: number;
}, action?: RunStep, context?: any) => Action;
export declare type IOnStep = (stepOptions: {
    from: number;
    to: number;
    count: number;
}, action?: RunStep, context?: any) => Promise<any>;
export declare class RunStep extends Action {
    protected from: number;
    protected step: number;
    protected limit: number;
    protected to: number;
    protected ignoreErr: boolean;
    protected breakWhenErr: boolean;
    protected endStep: boolean;
    protected queueName: string;
    protected queueAction: RunQueue;
    protected onBeforeStep: IOnStep;
    protected handleFactory: IHandlerFactory;
    protected onAfterStep: IOnStep;
    constructor(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: IOnStep, handleFactory?: IHandlerFactory, onAfterStep?: IOnStep, ignoreErr?: boolean, breakWhenErr?: boolean);
    numChildren(): number;
    setIgnoreErr(ignoreErr: boolean): RunStep;
    setBreakWhenErr(breakWhenErr: boolean): RunStep;
    setQueueName(queueName: string): RunStep;
    setValues(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: IOnStep, handleFactory?: IHandlerFactory, onAfterStep?: IOnStep): RunStep;
    setStep(step: number): RunStep;
    setLimit(limit: number): RunStep;
    setTo(to: number): RunStep;
    setOnBeforeStep(fn: IOnStep): RunStep;
    setOnAfterStep(fn: IOnStep): RunStep;
    end(): RunStep;
    addChild(...as: Action[]): RunStep;
    protected doStart(context: any): Promise<void>;
    protected doStop(context: any): Promise<any>;
}
