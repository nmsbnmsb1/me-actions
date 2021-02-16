import { Action } from './action';
export declare class ActionForSleep extends Action {
    private timeout;
    private timer;
    private tp;
    constructor(timeout: number);
    protected doStart(context: any): Promise<import("./action").IResult>;
    protected doStop(context: any): void;
}
