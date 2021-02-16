import { Action } from './action';

export type IInnerFunc = (context?: any, action?: RunFunc) => Promise<any>;

export class RunFunc extends Action {
	private iDoStart: IInnerFunc;
	private iDoStop?: IInnerFunc;

	constructor(doStart: IInnerFunc, doStop?: IInnerFunc) {
		super();
		this.iDoStart = doStart;
		this.iDoStop = doStop;
	}

	protected doStart(context: any) {
		return this.iDoStart(context, this);
	}

	protected doStop(context: any) {
		if (this.iDoStop) this.iDoStop(context, this);
	}
}
