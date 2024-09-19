import { CompositeAction } from './action';
export declare class RunAll extends CompositeAction {
    constructor(errHandler: number);
    protected doStart(context: any): Promise<void>;
}
