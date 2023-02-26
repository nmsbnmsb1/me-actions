import { Action } from './action';
export declare class ActionForSleep extends Action {
    private timeout;
    private timer;
    constructor(timeout: number);
    protected doStart(): Promise<void>;
    protected doStop(): void;
}
