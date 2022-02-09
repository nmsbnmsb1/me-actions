import { Action, CompositeAction } from './action';
export declare class RunAll extends CompositeAction {
    constructor(handleErr?: 0 | 1 | 2, ...as: Action[]);
    protected doStart(context: any): Promise<void>;
}
