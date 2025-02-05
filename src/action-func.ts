import { Action } from './action';

export type Func = (caller?: ActionForFunc, context?: any) => Promise<any>;

export class ActionForFunc extends Action {
	private innerDoStart: Func;
	private innerDoStop?: Func;

	constructor(doStart?: Func, doStop?: Func) {
		super();
		this.innerDoStart = doStart;
		this.innerDoStop = doStop;
	}
	public setDoStart(f: Func) {
		this.innerDoStart = f;
		return this;
	}
	public setDoStop(f: Func) {
		this.innerDoStop = f;
		return this;
	}

	protected async doStart(context: any) {
		return this.innerDoStart(this, context);
	}

	protected async doStop(context: any) {
		if (this.innerDoStop) return this.innerDoStop(this, context);
	}
}
