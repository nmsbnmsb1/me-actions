import { Action } from './action';
export declare class ActionForReject extends Action {
    private err;
    constructor(err: Error);
    protected doStart(context: any): Promise<void>;
}
