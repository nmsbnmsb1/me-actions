import { Action, CompositeAction, IResult, IDeferer } from './action';

export class RunQueue extends CompositeAction {
	protected closeMode: 'manual' | 'auto' = 'manual'; // 0 never 1 manuel 2 auto
	protected runCount: number = 10;

	protected running: Action[] = [];
	protected qp: IDeferer;
	protected locked = false;
	protected err?: any;

	constructor(runCount: number = 10, closeMode: 'manual' | 'auto' = 'manual', handleErr: 0 | 1 | 2 = 1, ...as: Action[]) {
		super(handleErr, ...as);
		this.name = 'run-queue';
		this.runCount = runCount;
		this.closeMode = closeMode;
		this.qp = Action.defer();
	}
	public setRunCount(runCount: number) {
		this.runCount = runCount;
		return this;
	}
	public setCloseMode(closeMode: 'manual' | 'auto') {
		this.closeMode = closeMode;
		return this;
	}
	//
	public addChild(...as: Action[]) {
		if ((this.isIdle() || this.isPending()) && !this.locked) {
			super.addChild(...as);
			if (this.isPending()) this.next();
		}
		return this;
	}
	public numChildren() {
		return this.children.length + this.running.length;
	}
	//
	public lock() {
		this.locked = true;
		if (this.isIdle()) this.stop();
		else if (this.isPending() && this.children.length === 0 && this.running.length === 0) this.stop();
	}
	public isLocked() {
		return this.locked;
	}
	//
	protected async doStart(context: any) {
		if (this.closeMode === 'auto' && this.children.length <= 0) {
			this.qp.resolve();
			return;
		}
		//
		this.next();
		await this.qp.p;
	}

	private next() {
		if (!this.isPending()) {
			this.qp.reject();
			return;
		}
		//
		let w;
		while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
			const action = this.children.shift();
			if (!action.isIdle()) continue;
			this.running.push(action);
			//
			action.start(this.result.context).watchFinallyAtFirst(
				w ||
					(w = (result: IResult) => {
						if (!this.isPending()) {
							this.qp.reject();
							return;
						}
						//
						const index = this.running.indexOf(result.action);
						if (index >= 0) this.running.splice(index, 1);
						if (result.action.isRejected()) {
							if (!this.err) this.err = result.err;
							if (this.closeMode === 'auto' && this.handleErr === 2) {
								this.qp.reject(this.err);
								return;
							}
						}
						//
						this.next();
					})
			);
		}
		//
		if (this.children.length === 0 && this.running.length === 0) {
			if ((this.closeMode === 'manual' && this.locked) || this.closeMode === 'auto') {
				this.locked = true;
				if (this.err && this.handleErr > 0) {
					this.qp.reject(this.err);
				} else {
					this.qp.resolve();
				}
			}
		}
	}

	protected doStop(context: any) {
		this.locked = true;
		for (const action of this.running) action.stop(context);
		this.running.length = 0;
		for (const action of this.children) action.stop(context);
		this.children.length = 0;
		//
		this.qp.reject();
	}

	//
	public async doOne(action: Action, context?: any) {
		if ((this.isIdle() || this.isPending()) && !this.locked) {
			let p = new Promise((resolve) => {
				if (context) action.setContext(context);
				action.watchFinally((result: IResult) => resolve(result));
			});
			super.addChild(action);
			if (this.isPending()) this.next();
			await p;
		}
		return action.getResult();
	}
	public stopOne(a: string | Action, context?: any) {
		for (let i = 0; i < this.running.length; i++) {
			const action = this.running[i];
			if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.running.splice(i, 1);
			action.stop(context || this.result.context);
			this.next();
			return;
		}
		for (let i = 0; i < this.children.length; i++) {
			const action = this.running[i];
			if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.children.splice(i, 1);
			action.stop(context || this.result.context);
			return;
		}
	}
}
