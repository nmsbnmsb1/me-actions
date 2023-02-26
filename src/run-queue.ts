import { Action, CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunQueue extends CompositeAction {
	public static StopHandlerManual = 0;
	public static StopHandlerAuto = 1;

	protected stopHandler = RunQueue.StopHandlerAuto;
	protected runCount = 5;
	protected running: Action[] = [];
	protected w: (action: Action) => any;
	protected e: Error;
	protected toStop = false;

	constructor(runCount: number = 5, stopHandler: number = RunQueue.StopHandlerAuto, errHandler: number = ErrHandler.RejectAllDone) {
		super(errHandler);
		this.runCount = runCount;
		this.stopHandler = stopHandler;
	}
	public setRunCount(runCount: number) {
		this.runCount = runCount;
		return this;
	}
	public setStopHandler(stopHandler: number) {
		this.stopHandler = stopHandler;
		return this;
	}
	public setToStop() {
		this.toStop = true;
		//查看是否可以立即结束
		if (this.isIdle()) {
			this.stop();
		} else if (this.isPending() && this.children.length === 0 && this.running.length === 0) {
			this.done();
		}
	}
	//
	public addChild(a: Action) {
		if ((this.isIdle() || this.isPending()) && !this.toStop) {
			super.addChild(a);
			if (this.isPending()) {
				this.next();
			}
		}
		return this;
	}
	public numChildren() {
		return this.children.length + this.running.length;
	}
	//
	protected async doStart(context: any) {
		if (this.stopHandler === RunQueue.StopHandlerAuto && this.children.length <= 0) return;
		//
		this.context = context;
		this.next();
		//
		await this.getRP().p;
	}
	private next() {
		if (!this.isPending()) return this.getRP().reject();
		//
		while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
			const action = this.children.shift();
			if (!action.isIdle()) continue;
			this.running.push(action);
			//
			action.start(this.context).watch(
				this.w ||
					(this.w = (action: Action) => {
						if (!this.isPending()) return this.getRP().reject();
						//
						let index = this.running.indexOf(action);
						if (index >= 0) {
							this.running.splice(index, 1);
							if (action.isRejected()) {
								if (!this.e) this.e = action.getError();
								if (this.errHandler === ErrHandler.RejectImmediately) return this.getRP().reject(this.e);
							}
						}
						//
						this.next();
					}),
				0
			);
		}
		//
		if (this.children.length === 0 && this.running.length === 0) {
			if (this.stopHandler === RunQueue.StopHandlerAuto || this.toStop) {
				this.toStop = true;
				this.done();
			}
		}
	}
	private done() {
		if (this.e && this.errHandler !== ErrHandler.Ignore) {
			this.getRP().reject(this.e);
		} else {
			this.getRP().resolve();
		}
	}
	//
	protected doStop(context: any) {
		this.toStop = true;
		for (const action of this.running) action.stop(context);
		this.running.length = 0;
		for (const action of this.children) action.stop(context);
		this.children.length = 0;
		this.endRP();
	}

	//
	public async doOne(a: Action) {
		if ((this.isIdle() || this.isPending()) && !this.toStop) {
			super.addChild(a);
			//
			let p = new Promise((resolve) => a.watch(resolve));
			if (this.isPending()) this.next();
			await p;
		}
		return a;
	}
	public stopOne(a: string | Action) {
		for (let i = 0; i < this.running.length; i++) {
			const action = this.running[i];
			if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.running.splice(i, 1);
			action.stop(this.context);
			this.next();
			return;
		}
		for (let i = 0; i < this.children.length; i++) {
			const action = this.running[i];
			if (typeof a === 'string' && a !== action.getName()) continue;
			else if (a !== action) continue;
			//
			this.children.splice(i, 1);
			action.stop(this.context);
			return;
		}
	}
}
