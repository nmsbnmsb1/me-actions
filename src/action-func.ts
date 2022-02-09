import { Action } from './action';

export type IFunc = (context: any, caller?: ActionForFunc) => Promise<any>;

export class ActionForFunc extends Action {
	private iDoStart: IFunc;
	private iDoStop?: IFunc;

	constructor(doStart?: IFunc, doStop?: IFunc) {
		super();
		this.name = 'action-func';
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

	protected doStart(context: any) {
		return this.iDoStart(context, this);
	}

	protected doStop(context: any) {
		if (this.iDoStop) this.iDoStop(context, this);
	}
}
