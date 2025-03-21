import { Action } from './action';
export type Func = (caller?: ActionForFunc, context?: any) => Promise<any>;
export declare class ActionForFunc extends Action {
    private innerDoStart;
    private innerDoStop?;
    constructor(doStart?: Func, doStop?: Func);
    setDoStart(f: Func): this;
    setDoStop(f: Func): this;
    protected doStart(context: any): Promise<any>;
    protected doStop(context: any): Promise<any>;
}
