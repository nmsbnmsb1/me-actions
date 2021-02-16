import { Action } from './action';
export declare class RunAll extends Action {
    protected ignoreErr: boolean;
    protected breakWhenErr: boolean;
    constructor(ignoreErr?: boolean, breakWhenErr?: boolean, ...as: Action[]);
    setIgnoreErr(ignoreErr: boolean): RunAll;
    setBreakWhenErr(breakWhenErr: boolean): RunAll;
    protected doStart(context: any): Promise<void>;
}
