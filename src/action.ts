export interface IDeferer {
	p?: Promise<IResult>;
	resolve?: any;
	reject?: any;
}

export interface IContext {
	logger?: (level: string, msg: any, result?: IResult) => void;
	datas?: { [name: string]: any };
	[name: string]: any;
}

export interface IResult {
	action: Action;
	context?: any;
	data?: any;
	err?: any;
	[name: string]: any;
}

export type IWatcher = (result?: IResult) => any;

export class Action {
	public static StatusIdle = 'idle';
	public static StatusPending = 'pending';
	public static StatusResolved = 'resolved';
	public static StatusRejected = 'rejected';
	public static StatusStopped = 'stopped';

	public static isError = (e: any) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
	public static defer(): IDeferer {
		const d: IDeferer = {} as any;
		d.p = new Promise((resolve, reject) => {
			d.resolve = resolve;
			d.reject = reject;
		});
		return d;
	}

	protected name: string;
	protected status: string = Action.StatusIdle;
	protected context?: any;
	protected result: IResult;
	protected watchers: { w: IWatcher; type: 'resolve' | 'reject' | 'finally' }[];

	constructor() {
		this.name = 'action';
		this.result = { action: this };
	}

	//
	public setName(name: string) {
		this.name = name;
		return this;
	}
	public getName() {
		return this.name;
	}
	public setContext(context: any) {
		this.context = context;
		return this;
	}
	public getContext() {
		return this.context;
	}
	public getResult() {
		return this.result;
	}

	//状态
	public getStatus() {
		return this.status;
	}
	public isIdle() {
		return this.status === Action.StatusIdle;
	}
	public isPending() {
		return this.status === Action.StatusPending;
	}
	public isResolved() {
		return this.status === Action.StatusResolved;
	}
	public isRejected() {
		return this.status === Action.StatusRejected || this.status === Action.StatusStopped;
	}
	public isStopped() {
		return this.status === Action.StatusStopped;
	}

	// 事件
	public watchResolved(watcher: IWatcher) {
		(this.watchers || (this.watchers = [])).push({ w: watcher, type: 'resolve' });
		return this;
	}
	public watchRejected(watcher: IWatcher) {
		(this.watchers || (this.watchers = [])).push({ w: watcher, type: 'reject' });
		return this;
	}
	public watchFinally(watcher: IWatcher) {
		(this.watchers || (this.watchers = [])).push({ w: watcher, type: 'finally' });
		return this;
	}
	public watchFinallyAtFirst(watcher: IWatcher) {
		(this.watchers || (this.watchers = [])).unshift({ w: watcher, type: 'finally' });
		return this;
	}

	//
	private logErr() {
		if (this.context && this.context.logger && (!this.context.errs || this.context.errs.indexOf(this.result.err) < 0)) {
			(this.context.errs || (this.context.errs = [])).push(this.result.err);
			this.context.logger('error', this.result.err, this.result);
		}
	}
	private dispatch(type: 'resolve' | 'reject') {
		for (let d of this.watchers) {
			if (d.type === type || d.type === 'finally') d.w(this.result);
		}
		this.watchers = undefined;
	}

	public start(context?: any) {
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
			if (!Action.isError(data)) {
				this.result.data = data;
				this.status = Action.StatusResolved;
				this.doStop(this.result.context);
				if (data && this.name && this.context) (this.context.datas || (this.context.datas = {}))[this.name] = data;
				if (this.watchers) this.dispatch('resolve');
				//
			} else {
				this.result.err = data;
				this.status = Action.StatusRejected;
				this.doStop(this.result.context);
				this.logErr();
				if (this.watchers) this.dispatch('reject');
			}
		};
		const cat = (err: Error) => {
			if (!this.isPending()) return;
			//
			this.result.err = err || new Error('rejected');
			this.status = Action.StatusRejected;
			this.doStop(this.result.context);
			this.logErr();
			if (this.watchers) this.dispatch('reject');
		};
		this.doStart(this.result.context).then(then, cat);
		//
		return this;
	}
	protected doStart(context: any): Promise<any> {
		return Promise.resolve();
	}
	public async startAsync(context?: any) {
		if (this.isIdle()) {
			const p = new Promise((resolve) => this.watchFinally(resolve));
			this.start(context);
			await p;
		}
		return this.result;
	}

	//
	public stop(context?: any) {
		if (this.isIdle() || this.isPending()) {
			if (!this.context) this.context = context;
			this.result.context = this.context;
			this.result.err = new Error('Stopped');
			this.status = Action.StatusStopped;
			if (this.isPending()) this.doStop(this.result.context);
			this.logErr();
			if (this.watchers) this.dispatch('reject');
		}
		return this;
	}
	protected doStop(context: any) {}
}

export class CompositeAction extends Action {
	protected children: Action[] = [];
	protected handleErr: 0 | 1 | 2 = 0;

	constructor(handleErr: 0 | 1 | 2 = 0, ...as: Action[]) {
		super();
		this.handleErr = handleErr;
		if (as && as.length > 0) this.addChild(...as);
	}
	public setHandleErr(handleErr: 0 | 1 | 2) {
		this.handleErr = handleErr;
		return this;
	}
	public getHandleErr() {
		return this.handleErr;
	}

	//层级结构
	public addChild(...as: Action[]) {
		for (const a of as) {
			this.children.push(a);
		}
		return this;
	}
	public addChildWithContext(a: Action, context: any) {
		a.setContext(context);
		this.children.push(a);
		return this;
	}
	public numChildren() {
		return this.children.length;
	}

	protected doStop(context: any) {
		for (const a of this.children) {
			a.stop(context);
		}
		this.children.length = 0;
	}
}
