export interface IDeferer {
	p?: Promise<IResult>;
	resolve?: any;
	reject?: any;
}

export interface IContext {
	datas?: { [index: string]: any };
	errs?: { [index: string]: any };
	[name: string]: any;
}

export interface IResult {
	action: Action;
	context?: any;
	data?: any;
	err?: any;
}

export type IWatcher = (result?: IResult) => any;

let ID: number = 1;

export class Action {
	public static StatusIdle = 'idle';
	public static StatusPending = 'pending';
	public static StatusResolved = 'resolved';
	public static StatusRejected = 'rejected';
	public static StatusStopped = 'stopped';

	public static efn = () => {};
	public static isError = (e: any) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
	public static defer(): IDeferer {
		const d: IDeferer = {} as any;
		d.p = new Promise((resolve, reject) => {
			d.resolve = resolve;
			d.reject = reject;
		});
		return d;
	}
	public static logResult = (result: IResult) => {
		if (!result.context) return;
		const name: string = result.action.getName();
		if (result.action.isResolved() && result.data) {
			if (result.context.datas) result.context.datas[name] = result.data;
		} else if (result.action.isRejected() && result.err) {
			if (result.context.errs) result.context.errs[name] = result.err;
		}
	};

	protected id: number = 0;
	protected name: string = '';
	protected status: string = Action.StatusIdle;
	protected context?: any;
	protected result!: IResult;
	protected children?: Action[];
	//
	//主线程
	private rp: IDeferer = Action.defer();
	//事件
	private ep!: IDeferer;

	constructor() {
		this.id = ID++;
		this.name = `${this.id}(${this.id})`;
		this.result = { action: this };
	}
	public getID(): number {
		return this.id;
	}
	public setName(name: string): Action {
		if (!name.match(/\([0-9]+\)$/gm)) name = `${name}(${this.id})`;
		this.name = name;
		return this;
	}
	public getName(): string {
		if (!this.name.match(/\([0-9]+\)$/gm)) this.name = `${this.name}(${this.id})`;
		return this.name;
	}
	public getChildName(child: Action, childName?: string) {
		if (!childName) return `${this.getName()}/${child.getName()}`;
		return `${this.getName()}/${childName}(${this.id})`;
	}
	//
	public getStatus(): string {
		return this.status;
	}
	public isIdle(): boolean {
		return this.status === Action.StatusIdle;
	}
	public isPending(): boolean {
		return this.status === Action.StatusPending;
	}
	public isStopped(): boolean {
		return this.status === Action.StatusStopped;
	}
	public isResolved(): boolean {
		return this.status === Action.StatusResolved;
	}
	public isRejected(): boolean {
		return this.status === Action.StatusRejected || this.status === Action.StatusStopped;
	}
	//
	public setContext(context: any): Action {
		this.context = context;
		return this;
	}
	public getContext(): any {
		return this.context;
	}
	public getResult(): IResult {
		return this.result;
	}
	public addChild(...as: Action[]): Action {
		for (const a of as) {
			a.setName(this.getChildName(a));
			(this.children || (this.children = [])).push(a);
		}
		return this;
	}
	public addChildWithContext(action: Action, context: any): Action {
		return this.addChild(action.setContext(context));
	}
	public numChildren(): number {
		return this.children ? this.children.length : 0;
	}

	// 事件
	private getep() {
		if (!this.ep) this.ep = Action.defer();
		return this.ep;
	}
	public watchResolved(watcher: IWatcher): Action {
		this.getep().p.then(watcher, Action.efn);
		return this;
	}
	public watchRejected(watcher: IWatcher): Action {
		this.getep().p.catch(watcher);
		return this;
	}
	public watchFinally(watcher: IWatcher): Action {
		this.getep().p.then(watcher, Action.efn);
		this.getep().p.catch(watcher);
		return this;
	}
	//like promise chain
	//private epchain!: Promise<IResult>;
	// public promiseThen(onfulfilled: IWatcher, onrejected?: IWatcher): Action {
	// 	this.epchain = (this.epchain || this.getep().p).then(onfulfilled, onrejected);
	// 	return this;
	// }
	// public promiseCatch(onrejected: IWatcher): Action {
	// 	this.epchain = (this.epchain || this.getep().p).catch(onrejected);
	// 	return this;
	// }
	// public promiseFinally(onfinally: IWatcher, avoidUnhandledRejectionWarning: boolean = false): Action {
	// 	//有的时候只注册finally，又不想触发unhandleRejectWarning
	// 	if (avoidUnhandledRejectionWarning) this.epchain = (this.epchain || this.getep().p).catch(Action.efn as any);
	// 	this.epchain = (this.epchain || this.getep().p).finally(onfinally as any);
	// 	return this;
	// }

	//
	public start(context?: any): Action {
		if (!this.isIdle()) return this;
		//
		this.status = Action.StatusPending;
		if (!this.context) this.context = context;
		this.result.context = this.context;
		//
		//this.rp = Action.defer();
		const then = (data?: any) => {
			//console.log('then', this.name, this.isPending(), data);
			if (!this.isPending()) return;
			//
			if (Object.prototype.toString.call(data) === '[object Object]' && Object.prototype.hasOwnProperty.call(data, 'action')) {
				data = (data as IResult).err || (data as IResult).data;
			}
			if (!Action.isError(data)) {
				this.result.data = data;
				this.status = Action.StatusResolved;
				this.doStop(this.result.context);
				//
				this.rp.resolve(this.result);
				if (this.ep) this.ep.resolve(this.result);
			} else {
				this.result.err = data;
				this.status = Action.StatusRejected;
				this.doStop(this.result.context);
				//
				this.rp.resolve(this.result);
				if (this.ep) this.ep.reject(this.result);
			}
		};
		this.doStart(this.result.context).then(then, then);
		//
		return this;
	}
	public p(): Promise<IResult> {
		if (!this.isIdle() && !this.isPending()) {
			return new Promise((resolve) => resolve(this.result));
		}
		return this.rp.p;
	}
	public async startAsync(context?: any) {
		return this.start(context).p();
	}
	//IResult | Error | void
	protected doStart(context: any): Promise<any> {
		return Promise.resolve();
	}

	//
	public stop(context?: any): Action {
		if (this.isIdle() || this.isPending()) {
			if (!this.context) this.context = context;
			this.result.context = this.context;
			this.result.err = new Error('Stopped');
			this.status = Action.StatusStopped;
			//
			if (this.isPending()) this.doStop(this.result.context);
			//
			this.rp.resolve(this.result);
			if (this.ep) this.ep.reject(this.result);
		}
		return this;
	}

	protected doStop(context: any) {
		if (this.children && this.children.length > 0) {
			for (const action of this.children) action.stop(context);
			this.children.length = 0;
		}
	}
}
