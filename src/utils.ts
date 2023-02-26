import { Action } from './action';

export interface IContext {
	logger?: (level: string, msg: any, action?: Action) => void;
	datas?: { [name: string]: any };
	errs?: Error[];
	[name: string]: any;
}

export const isError = (e: any) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;

export type IWatcher = (action?: Action, context?: any, data?: any, err?: Error) => any;

export interface IDeferer {
	p?: Promise<Action>;
	resolve?: any;
	reject?: any;
}
export const defer = (): IDeferer => {
	const d: IDeferer = {} as any;
	d.p = new Promise((resolve, reject) => {
		d.resolve = resolve;
		d.reject = reject;
	});
	return d;
};

export const ActionStatus = {
	Idle: 0,
	Pending: 1,
	Resolved: 2,
	Rejected: 3,
	Stopped: 4,
};
export const ErrHandler = {
	Ignore: 0,
	RejectImmediately: 1,
	RejectAllDone: 2,
};
