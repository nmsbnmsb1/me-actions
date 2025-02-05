import { ActionStatus, type ActionWatcher, type Deferer, ErrHandler, defer, isError } from './utils';

export class Action {
	protected parent: Action;
	protected context: any;
	protected name: string;
	protected status: number = ActionStatus.Idle;
	protected data: any;
	protected error: Error;
	protected watchers: ActionWatcher[];
	//utils
	protected rp: Deferer;

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
	public getFullName(ln = '/', showAll = false): string {
		let name = this.name || (showAll ? '..' : '');
		if (this.parent) {
			let pn = this.parent.getFullName(ln, showAll);
			if (pn) {
				return !name ? pn : `${pn}${ln}${name}`;
			}
		}
		return name;
	}
	public getData() {
		return this.data;
	}
	public getError() {
		return this.error;
	}
	//状态
	public getStatus() {
		return this.status;
	}
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
	public watch(w: ActionWatcher, index = -1) {
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
	protected endRP(resolve = true, data?: any) {
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
			if (this.context.logger) {
				this.context.logger('error', this.error, this, this.context);
			}
		}
	}
	protected async dispatch() {
		if (!this.watchers) return;
		for (let w of this.watchers) {
			if (w) {
				let result = w(this, this.context, this.data, this.error);
				if (result?.then) {
					await result;
				}
			}
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
				data = isError(err) ? err : new Error(err);
			}
			//console.log('then', this.name, this.isPending(), data);
			if (this.isPending()) {
				if (!isError(data)) {
					this.data = data;
					this.status = ActionStatus.Resolved;
					this.logData();
				} else {
					this.error = data;
					this.status = ActionStatus.Rejected;
					this.logErr();
				}
				await this.doStop(this.context);
				if (this.rp) this.endRP(true);
				await this.dispatch();
			}
		}
		return this;
	}
	protected async doStart(context: any): Promise<any> {
		return;
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
			await this.dispatch();
		}
		return this;
	}
	protected async doStop(context: any): Promise<any> {
		return;
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
