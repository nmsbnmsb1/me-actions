import { ActionStatus, defer, ErrHandler, IDeferer, isError, IWatcher } from './utils';

export class Action {
	protected parent: Action;
	protected context: any;
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
		return this.name || '';
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
	//watcher
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
	protected endRP(resolve: boolean = true, data?: any) {
		if (this.rp) {
			resolve ? this.rp.resolve(data) : this.rp.reject(data || new Error('end runtime promise'));
		}
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
	public async start(context?: any) {
		if (this.isIdle()) {
			let data: any;
			try {
				this.context = this.context || context;
				this.status = ActionStatus.Pending;
				data = await this.doStart(this.context);
				//如果返回了另外一个Action
				if (data instanceof Action) {
					let a = data as Action;
					data = a.isResolved() ? a.getData() : a.getError() || new Error('unknown');
				}
			} catch (err) {
				data = err;
			}
			//console.log('then', this.name, this.isPending(), data);
			if (this.isPending()) {
				if (!isError(data)) {
					this.data = data;
					this.status = ActionStatus.Resolved;
				} else {
					this.error = data;
					this.status = ActionStatus.Rejected;
				}
				await this.doStop(this.context);
				if (this.rp) this.endRP(true);
				this.logData();
				this.dispatch();
			}
		}
		return this;
	}
	protected async doStart(context: any) {
		return null as any;
	}
	public async stop(context?: any) {
		if (this.isIdle() || this.isPending()) {
			let isPending = this.isPending();
			this.status = ActionStatus.Stopped;
			if (isPending) {
				this.context = this.context || context;
				await this.doStop(this.context);
				if (this.rp) this.endRP(true);
			}
			this.dispatch();
		}
		return this;
	}
	protected async doStop(context: any) {
		return null as any;
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
	public addChildren(as: Action[]) {
		for (let a of as) {
			this.children.push(a);
			(a as any).parent = this;
		}
		return this;
	}
	public numChildren() {
		return this.children.length;
	}

	protected async doStop(context: any) {
		if (this.children.length > 0) {
			let all = [];
			for (const a of this.children) all.push(a.stop(context));
			await Promise.all(all);
		}
		this.children.length = 0;
	}
}
