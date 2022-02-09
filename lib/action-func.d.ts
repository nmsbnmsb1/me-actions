import { Action } from './action';
export declare type IFunc = (context: any, caller?: ActionForFunc) => Promise<any>;
export declare class ActionForFunc extends Action {
    private iDoStart;
    private iDoStop?;
    constructor(doStart?: IFunc, doStop?: IFunc);
    setDoStart(f: IFunc): this;
    setDoStop(f: IFunc): this;
    protected doStart(context: any): Promise<any>;
    protected doStop(context: any): void;
}
