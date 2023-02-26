import { CompositeAction } from './action';
export declare class RunLogic extends CompositeAction {
    protected condition: number;
    protected count: number;
    constructor(condition?: number, count?: number);
    setCondition(condition: number): this;
    setCount(count: number): this;
    protected doStart(context: any): Promise<void>;
}
