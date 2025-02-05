import { Action, CompositeAction } from './action';
import { type Func } from './action-func';
import { RunQueue } from './run-queue';
export interface StepRange {
    from: number;
    to: number;
    count: number;
    limit: number;
}
export type StepHandlerFactory = (caller: RunStep, context: any, i: number, range: StepRange) => Action | Func | Promise<Action | Func>;
export type OnStep = (caller: RunStep, context: any, range: StepRange) => Promise<any>;
export declare class RunStep extends CompositeAction {
    protected from: number;
    protected step: number;
    protected limit: number;
    protected to: number;
    protected onBeforeStep: OnStep;
    protected handlerFactory: StepHandlerFactory;
    protected onAfterStep: OnStep;
    protected queueAction: RunQueue;
    protected queueName: string;
    protected toStop: boolean;
    constructor(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: OnStep, handlerFactory?: StepHandlerFactory, onAfterStep?: OnStep, errHandler?: number);
    setValues(from?: number, step?: number, limit?: number, to?: number): this;
    setOnBeforeStep(fn: OnStep): this;
    setHandlerFactory(fn: StepHandlerFactory): this;
    setOnAfterStep(fn: OnStep): this;
    setQueueName(name: string): this;
    setToStop(): this;
    extendLimit(limit: number): number;
    extendTo(to: number): number;
    addChild(a: Action): this;
    numChildren(): number;
    protected doStart(context: any): Promise<void>;
    protected doStop(context: any): Promise<void>;
}
