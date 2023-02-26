import { ActionStatus, defer, ErrHandler, IDeferer, isError, IWatcher } from './utils';

export class Action {
	protected context: any;
	protected parent: Action;
	protected name: string;
	protected status: number = ActionStatus.Idle;
	protected data: any;
	protected error: Error;
	protected watchers: IWatcher[];
	//utils
	protected rp: IDeferer;

	public setContext(context: any) {
		this.context = context;
		return this;
	}
	public getContext() {
		return this.context;
	}
	public setName(name: string) {
		this.name = name;
		return this;
	}
	public getName(): string {
		return this.name;
	}
	public getFullName(ln: string = '/'): string {
		if (this.parent) {
			let pn = this.parent.getFullName(ln);
			if (pn) {
				return !this.name ? pn : `${pn}${ln}${this.name}`;
			}
		}
		return this.name;
	}
	public getData() {
		return this.data;
	}
	public getError() {
		return this.error;
	}
	//状态
	public isIdle() {
		return this.status === ActionStatus.Idle;
	}
	public isPending() {
		return this.status === ActionStatus.Pending;
	}
	public isResolved() {
		return this.status === ActionStatus.Resolved;
	}
	public isRejected() {
		return this.status === ActionStatus.Rejected;
	}
	public isStopped() {
		return this.status === ActionStatus.Stopped;
	}
	//
	public watch(w: IWatcher, index = -1) {
		let ws = this.watchers || (this.watchers = []);
		if (index < 0) ws.push(w);
		else if (!ws[index]) ws[index] = w;
		else {
			ws.splice(index, 0, w);
		}
		return this;
	}

	//
	protected getRP() {
		return this.rp || (this.rp = defer());
	}
	protected endRP(reject: boolean = true, data?: any) {
		if (this.rp) reject ? this.rp.reject(data) : this.rp.resolve(data);
	}
	protected logData() {
		if (this.data && this.context && this.name) {
			(this.context.datas || (this.context.datas = {}))[this.name] = this.data;
		}
	}
	protected logErr() {
		if (this.context && (!this.context.errs || this.context.errs.indexOf(this.error) < 0)) {
			(this.context.errs || (this.context.errs = [])).push(this.error);
			if (this.context.logger) this.context.logger('error', this.error, this);
		}
	}
	protected dispatch() {
		if (!this.watchers) return;
		//
		for (let w of this.watchers) {
			if (w) w(this, this.context, this.data, this.error);
		}
		this.watchers.length = 0;
	}

	//执行
	public start(context?: any) {
		if (!this.isIdle()) return this;
		//
		let ctx = this.context || context;
		this.status = ActionStatus.Pending;
		this.doStart(ctx).then(
			(data?: any) => {
				//console.log('then', this.name, this.isPending(), data);
				if (!this.isPending()) return;
				//如果返回了另外一个Action
				if (data instanceof Action) {
					let a = data as Action;
					data = a.isResolved() ? a.getData() : a.getError() || new Error('unknown');
				}
				//
				if (!isError(data)) {
					this.data = data;
					this.status = ActionStatus.Resolved;
					this.doStop(ctx);
					this.logData();
					this.dispatch();
				} else {
					this.error = data;
					this.status = ActionStatus.Rejected;
					this.doStop(ctx);
					this.logErr();
					this.dispatch();
				}
			},
			(err: Error) => {
				if (!this.isPending()) return;
				//
				this.error = err;
				this.status = ActionStatus.Rejected;
				this.doStop(ctx);
				this.logErr();
				this.dispatch();
			}
		);
		//
		return this;
	}
	protected async doStart(context: any): Promise<any> {
		return Promise.resolve();
	}
	public async startAsync(context?: any) {
		if (this.isIdle()) {
			const p = new Promise((resolve) => this.watch(resolve));
			this.start(context);
			await p;
		}
		return this;
	}

	//
	public stop(context?: any) {
		if (this.isIdle() || this.isPending()) {
			let isPending = this.isPending();
			this.status = ActionStatus.Stopped;
			if (isPending) this.doStop(this.context || context);
			this.dispatch();
		}
		return this;
	}
	protected doStop(context: any) {
		this.endRP();
	}
}

export class CompositeAction extends Action {
	protected children: Action[] = [];
	protected errHandler: number = ErrHandler.Ignore;

	constructor(errHandler: number = ErrHandler.Ignore) {
		super();
		this.errHandler = errHandler;
	}
	public setErrHandler(errHandler: number) {
		this.errHandler = errHandler;
		return this;
	}
	//层级结构
	public addChild(a: Action) {
		this.children.push(a);
		(a as any).parent = this;
		return this;
	}
	public numChildren() {
		return this.children.length;
	}

	protected doStop(context: any) {
		for (const a of this.children) a.stop(context);
		this.children.length = 0;
		this.endRP();
	}
}
