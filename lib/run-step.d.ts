import { Action, CompositeAction } from './action';
import { RunQueue } from './run-queue';
export declare type IHandlerFactory = (i: number, stepOptions: {
    from: number;
    to: number;
    count: number;
}, caller?: RunStep, context?: any) => Action;
export declare type IOnStep = (stepOptions: {
    from: number;
    to: number;
    count: number;
}, action?: RunStep, context?: any) => Promise<any>;
export declare class RunStep extends CompositeAction {
    protected from: number;
    protected step: number;
    protected limit: number;
    protected to: number;
    protected endStep: boolean;
    protected queueName: string;
    protected queueAction: RunQueue;
    protected onBeforeStep: IOnStep;
    protected handleFactory: IHandlerFactory;
    protected onAfterStep: IOnStep;
    constructor(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: IOnStep, handleFactory?: IHandlerFactory, onAfterStep?: IOnStep, handleErr?: 0 | 1 | 2);
    setQueueName(name: string): this;
    setStep(step: number): this;
    setLimit(limit: number): this;
    setTo(to: number): this;
    setValues(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: IOnStep, handleFactory?: IHandlerFactory, onAfterStep?: IOnStep): this;
    setOnBeforeStep(fn: IOnStep): this;
    setOnAfterStep(fn: IOnStep): this;
    end(): this;
    addChild(...as: Action[]): this;
    numChildren(): number;
    protected doStart(context: any): Promise<void>;
    protected doStop(context: any): void;
}
