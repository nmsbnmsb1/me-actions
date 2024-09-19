import { CompositeAction } from './action';
export declare class RunOne extends CompositeAction {
    constructor(errHandler: number);
    protected doStart(context: any): Promise<void>;
}
