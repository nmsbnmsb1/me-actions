export interface IDeferer {
	p?: Promise<IResult>;
	resolve?: any;
	reject?: any;
}

export interface IContext {
	logger?: (level: string, msg: any, context?: IContext, action?: Action, info?: any) => void;
	datas?: { [name: string]: any };
	[name: string]: any;
}

export interface IResult {
	action: Action;
	context?: any;
	data?: any;
	err?: any;
}

export type IWatcher = (result?: IResult) => any;

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

	protected name: string;
	protected aliasName: string;
	protected logInfo: any;
	protected status: string = Action.StatusIdle;
	protected context?: any;
	protected result: IResult;
	//事件
	private ep!: IDeferer;

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
	public setAliasName(aliasName: string) {
		this.aliasName = aliasName;
		return this;
	}
	public getAliasName() {
		return this.aliasName;
	}
	public setLogInfo(info: any) {
		this.logInfo = info;
		return this;
	}
	public getLogInfo() {
		return this.logInfo;
	}
	// public setPath(path: string) {
	// 	this.path = path;
	// 	return this;
	// }
	// public getPath() {
	// 	let fullPath = '';
	// 	//
	// 	let p: Action = this;
	// 	while (p) {
	// 		let ppath = '';
	// 		if (p.path) ppath = p.path;
	// 		if (p.name) ppath = !ppath ? p.name : `${ppath}/${p.name}`;
	// 		if (ppath) fullPath = !fullPath ? ppath : `${ppath}/${fullPath}`;
	// 		//
	// 		if (p.path) break;
	// 		p = p.parent;
	// 	}
	// 	//
	// 	return fullPath;
	// }
	//
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
	private getep() {
		if (!this.ep) this.ep = Action.defer();
		return this.ep;
	}
	public watchResolved(watcher: IWatcher) {
		this.getep().p.then(watcher, Action.efn);
		return this;
	}
	public watchRejected(watcher: IWatcher) {
		this.getep().p.catch(watcher);
		return this;
	}
	public watchFinally(watcher: IWatcher) {
		this.getep().p.then(watcher, watcher);
		return this;
	}

	//
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
				//
				if (data && this.aliasName && this.context) {
					(this.context.datas || (this.context.datas = {}))[this.aliasName] = data;
				}
				if (this.ep) this.ep.resolve(this.result);
			} else {
				this.result.err = data;
				this.status = Action.StatusRejected;
				this.doStop(this.result.context);
				//
				this.logErr('then');
				if (this.ep) this.ep.reject(this.result);
			}
		};
		const cat = (err: Error) => {
			if (!this.isPending()) return;
			//
			this.result.err = err || new Error('rejected');
			this.status = Action.StatusRejected;
			this.doStop(this.result.context);
			//
			this.logErr('catch');
			if (this.ep) this.ep.reject(this.result);
		};
		this.doStart(this.result.context).then(then, cat);
		//
		return this;
	}
	protected doStart(context: any): Promise<any> {
		return Promise.resolve();
	}
	protected logErr(time: 'then' | 'catch' | 'stop') {
		if (this.context && this.context.logger && (!this.context.errs || this.context.errs.indexOf(this.result.err) < 0)) {
			(this.context.errs || (this.context.errs = [])).push(this.result.err);
			this.context.logger('error', this.result.err, this.context, this, this.logInfo);
		}
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
			//
			this.logErr('stop');
			if (this.ep) this.ep.reject(this.result);
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
