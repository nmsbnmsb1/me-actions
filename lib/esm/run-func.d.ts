import { Action } from './action';
export declare type IInnerFunc = (context?: any, action?: RunFunc) => Promise<any>;
export declare class RunFunc extends Action {
    private iDoStart;
    private iDoStop?;
    constructor(doStart: IInnerFunc, doStop?: IInnerFunc);
    protected doStart(context: any): Promise<any>;
    protected doStop(context: any): void;
}
