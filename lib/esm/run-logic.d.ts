import { Action, CompositeAction } from './action';
export declare class RunLogic extends CompositeAction {
    protected condition: string;
    protected count: number;
    constructor(condition?: string, count?: number, ...as: Action[]);
    setCondition(condition: string): this;
    setCount(count: number): this;
    protected doStart(context: any): Promise<void>;
}
