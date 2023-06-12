import { Action, CompositeAction } from './action';
import { IFunc } from './action-func';
import { RunQueue } from './run-queue';
export interface IRange {
    from: number;
    to: number;
    count: number;
}
export type IHandlerFactory = (context: any, i: number, range: IRange, caller: RunStep) => Action | IFunc | Promise<Action | IFunc>;
export type IOnStep = (context: any, range: IRange, caller: RunStep) => Promise<any>;
export declare class RunStep extends CompositeAction {
    protected from: number;
    protected step: number;
    protected limit: number;
    protected to: number;
    protected onBeforeStep: IOnStep;
    protected handlerFactory: IHandlerFactory;
    protected onAfterStep: IOnStep;
    protected queueAction: RunQueue;
    protected queueName: string;
    protected toStop: boolean;
    constructor(from?: number, step?: number, limit?: number, to?: number, onBeforeStep?: IOnStep, handlerFactory?: IHandlerFactory, onAfterStep?: IOnStep, errHandler?: number);
    setValues(from?: number, step?: number, limit?: number, to?: number): this;
    setOnBeforeStep(fn: IOnStep): this;
    setHandlerFactory(fn: IHandlerFactory): this;
    setOnAfterStep(fn: IOnStep): this;
    setQueueName(name: string): this;
    setToStop(): this;
    addChild(a: Action): this;
    numChildren(): number;
    protected doStart(context: any): Promise<void>;
    protected doStop(context: any): void;
}
