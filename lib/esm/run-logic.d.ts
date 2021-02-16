import { Action } from './action';
export declare class RunLogic extends Action {
    protected condition: string;
    protected count: number;
    constructor(condition?: string, count?: number, ...as: Action[]);
    setCondition(condition: string): RunLogic;
    setCount(count: number): RunLogic;
    protected doStart(context: any): Promise<void>;
}
