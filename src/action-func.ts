import { Action } from './action';

export type IFunc = (context: any, caller?: ActionForFunc) => Promise<any>;

export class ActionForFunc extends Action {
	private iDoStart: IFunc;
	private iDoStop?: IFunc;

	constructor(doStart?: IFunc, doStop?: IFunc) {
		super();
		this.iDoStart = doStart;
		this.iDoStop = doStop;
	}
	public setDoStart(f: IFunc) {
		this.iDoStart = f;
		return this;
	}
	public setDoStop(f: IFunc) {
		this.iDoStop = f;
		return this;
	}

	protected async doStart(context: any) {
		return this.iDoStart(context, this);
	}

	protected doStop(context: any) {
		if (this.iDoStop) return this.iDoStop(context, this);
	}
}
