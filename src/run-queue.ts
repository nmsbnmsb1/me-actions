import { Action, IDeferer, IResult } from './action';

export class RunQueue extends Action {
	protected closeMode: 'manual' | 'auto' = 'manual'; // 0 never 1 manuel 2 auto
	protected ignoreErr: boolean = true;
	protected breakWhenErr: boolean = false;
	protected runCount: number = 10;

	protected running: Action[] = [];
	protected locked: boolean = false;
	protected qp: IDeferer;
	protected err?: any;

	constructor(runCount: number = 10, closeMode: 'manual' | 'auto' = 'manual', ignoreErr: boolean = true, breakWhenErr: boolean = false, ...as: Action[]) {
		super();
		this.runCount = runCount;
		this.closeMode = closeMode;
		this.ignoreErr = ignoreErr;
		this.breakWhenErr = breakWhenErr;
		this.children = [];
		if (as && as.length > 0) this.addChild(...as);
	}

	public setRunCount(runCount: number): RunQueue {
		this.runCount = runCount;
		return this;
	}

	public setCloseMode(closeMode: 'manual' | 'auto'): RunQueue {
		this.closeMode = closeMode;
		return this;
	}

	public setIgnoreErr(ignoreErr: boolean): RunQueue {
		this.ignoreErr = ignoreErr;
		return this;
	}

	public setBreakWhenErr(breakWhenErr: boolean): RunQueue {
		this.breakWhenErr = breakWhenErr;
		return this;
	}

	public numChildren(): number {
		return super.numChildren() + this.running.length;
	}

	public addChild(...as: Action[]): RunQueue {
		if ((this.isIdle() || this.isPending()) && !this.locked) {
			super.addChild(...as);
			if (this.isPending()) this.next();
		}
		return this;
	}

	public lock() {
		this.locked = true;
	}

	public isLocked() {
		return this.locked;
	}

	protected async doStart(context: any) {
		if (this.closeMode === 'auto' && this.children.length <= 0) {
			this.locked = true;
			return Promise.resolve();
		}
		//
		this.qp = Action.defer();
		this.next();
		return this.qp.p;
	}

	private next() {
		if (!this.isPending()) {
			if (this.qp) this.qp.reject(this.result.err || new Error('is not pending'));
			return;
		}
		//
		while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
			const action = this.children.shift();
			if (!action.isIdle()) continue;
			this.running.push(action);
			//
			action.start(this.result.context).watchFinally((result: IResult) => {
				if (!this.isPending()) {
					this.qp.reject(this.err || result.err || this.result.err || new Error('is not pending'));
					return;
				}
				//
				const index = this.running.indexOf(action);
				if (index >= 0) this.running.splice(index, 1);
				Action.logResult(result);
				//
				if (action.isRejected() && this.closeMode === 'auto') {
					if (!this.err) this.err = result.err;
					if (this.breakWhenErr) {
						//stop children
						if (this.children.length > 0 || this.running.length > 0) {
							this.locked = true;
							for (const action of this.running) action.stop(this.result.context);
							this.running.length = 0;
							for (const action of this.children) action.stop(this.result.context);
							this.children.length = 0;
						}
						//
						this.qp.reject(this.err);
						return;
					}
				}
				//
				this.next();
			});
		}
		//
		if (this.children.length === 0 && this.running.length === 0) {
			if ((this.closeMode === 'manual' && this.locked) || this.closeMode === 'auto') {
				this.locked = true;
				if (this.err && !this.ignoreErr) {
					this.qp.reject(this.err);
				} else {
					this.qp.resolve();
				}
			}
		}
	}

	protected async doStop(context: any) {
		this.locked = true;
		for (const action of this.running) action.stop(context);
		this.running.length = 0;
		for (const action of this.children) action.stop(context);
		this.children.length = 0;
		if (this.qp) this.qp.reject(this.result.err || new Error('stopped'));
	}

	//
	public async do(action: Action, context?: any): Promise<any> {
		if ((this.isIdle() || this.isPending()) && !this.locked) {
			return new Promise((resolve) => {
				if (context) action.setContext(context);
				action.watchFinally((result: IResult) => resolve(result));
				super.addChild(action);
				this.next();
			});
		}
	}

	public stopOne(a: number | string | Action, context?: any) {
		for (let i = 0; i < this.running.length; i++) {
			const action = this.running[i];
			if (typeof a === 'number' && a !== action.getID()) continue;
			else if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.running.splice(i, 1);
			action.stop(context || this.result.context);
			this.next();
			return;
		}
		for (let i = 0; i < this.children.length; i++) {
			const action = this.running[i];
			if (typeof a === 'number' && a !== action.getID()) continue;
			else if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.children.splice(i, 1);
			action.stop(context || this.result.context);
			return;
		}
	}
}
