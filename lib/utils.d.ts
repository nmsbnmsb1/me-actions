import type { Action } from './action';
export interface ActionContext {
    logger?: (level: string, msg: any, action?: Action) => void;
    datas?: {
        [name: string]: any;
    };
    errs?: Error[];
    [name: string]: any;
}
export declare const isError: (e: any) => boolean;
export type ActionWatcher = (action?: Action, context?: any, data?: any, err?: Error) => any;
export interface Deferer {
    p?: Promise<any>;
    resolve?: any;
    reject?: any;
}
export declare const defer: () => Deferer;
export declare const ActionStatus: {
    Idle: number;
    Pending: number;
    Resolved: number;
    Rejected: number;
    Stopped: number;
};
export declare const ErrHandler: {
    Ignore: number;
    RejectImmediately: number;
    RejectAllDone: number;
};
