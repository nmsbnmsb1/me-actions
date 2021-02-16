import { Action } from './action';
export declare class RunOne extends Action {
    protected ignoreErr: boolean;
    constructor(ignoreErr?: boolean, ...as: Action[]);
    setIgnoreErr(ignoreErr: boolean): RunOne;
    protected doStart(context: any): Promise<void>;
}
