export class Action {
    static StatusIdle = 'idle';
    static StatusPending = 'pending';
    static StatusResolved = 'resolved';
    static StatusRejected = 'rejected';
    static StatusStopped = 'stopped';
    static efn = () => { };
    static isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
    static defer() {
        const d = {};
        d.p = new Promise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
        });
        return d;
    }
    name;
    aliasName;
    logInfo;
    status = Action.StatusIdle;
    context;
    result;
    ep;
    constructor() {
        this.name = 'action';
        this.result = { action: this };
    }
    setName(name) {
        this.name = name;
        return this;
    }
    getName() {
        return this.name;
    }
    setAliasName(aliasName) {
        this.aliasName = aliasName;
        return this;
    }
    getAliasName() {
        return this.aliasName;
    }
    setLogInfo(info) {
        this.logInfo = info;
        return this;
    }
    getLogInfo() {
        return this.logInfo;
    }
    setContext(context) {
        this.context = context;
        return this;
    }
    getContext() {
        return this.context;
    }
    getResult() {
        return this.result;
    }
    getStatus() {
        return this.status;
    }
    isIdle() {
        return this.status === Action.StatusIdle;
    }
    isPending() {
        return this.status === Action.StatusPending;
    }
    isResolved() {
        return this.status === Action.StatusResolved;
    }
    isRejected() {
        return this.status === Action.StatusRejected || this.status === Action.StatusStopped;
    }
    isStopped() {
        return this.status === Action.StatusStopped;
    }
    getep() {
        if (!this.ep)
            this.ep = Action.defer();
        return this.ep;
    }
    watchResolved(watcher) {
        this.getep().p.then(watcher, Action.efn);
        return this;
    }
    watchRejected(watcher) {
        this.getep().p.catch(watcher);
        return this;
    }
    watchFinally(watcher) {
        this.getep().p.then(watcher, watcher);
        return this;
    }
    start(context) {
        if (!this.isIdle())
            return this;
        this.status = Action.StatusPending;
        if (!this.context)
            this.context = context;
        this.result.context = this.context;
        const then = (data) => {
            if (!this.isPending())
                return;
            if (!Action.isError(data)) {
                this.result.data = data;
                this.status = Action.StatusResolved;
                this.doStop(this.result.context);
                if (data && this.aliasName && this.context) {
                    (this.context.datas || (this.context.datas = {}))[this.aliasName] = data;
                }
                if (this.ep)
                    this.ep.resolve(this.result);
            }
            else {
                this.result.err = data;
                this.status = Action.StatusRejected;
                this.doStop(this.result.context);
                this.logErr('then');
                if (this.ep)
                    this.ep.reject(this.result);
            }
        };
        const cat = (err) => {
            if (!this.isPending())
                return;
            this.result.err = err || new Error('rejected');
            this.status = Action.StatusRejected;
            this.doStop(this.result.context);
            this.logErr('catch');
            if (this.ep)
                this.ep.reject(this.result);
        };
        this.doStart(this.result.context).then(then, cat);
        return this;
    }
    doStart(context) {
        return Promise.resolve();
    }
    logErr(time) {
        if (this.context && this.context.logger && (!this.context.errs || this.context.errs.indexOf(this.result.err) < 0)) {
            (this.context.errs || (this.context.errs = [])).push(this.result.err);
            this.context.logger('error', this.result.err, this.context, this, this.logInfo);
        }
    }
    async startAsync(context) {
        if (this.isIdle()) {
            const p = new Promise((resolve) => this.watchFinally(resolve));
            this.start(context);
            await p;
        }
        return this.result;
    }
    stop(context) {
        if (this.isIdle() || this.isPending()) {
            if (!this.context)
                this.context = context;
            this.result.context = this.context;
            this.result.err = new Error('Stopped');
            this.status = Action.StatusStopped;
            if (this.isPending())
                this.doStop(this.result.context);
            this.logErr('stop');
            if (this.ep)
                this.ep.reject(this.result);
        }
        return this;
    }
    doStop(context) { }
}
export class CompositeAction extends Action {
    children = [];
    handleErr = 0;
    constructor(handleErr = 0, ...as) {
        super();
        this.handleErr = handleErr;
        if (as && as.length > 0)
            this.addChild(...as);
    }
    setHandleErr(handleErr) {
        this.handleErr = handleErr;
        return this;
    }
    getHandleErr() {
        return this.handleErr;
    }
    addChild(...as) {
        for (const a of as) {
            this.children.push(a);
        }
        return this;
    }
    addChildWithContext(a, context) {
        a.setContext(context);
        this.children.push(a);
        return this;
    }
    numChildren() {
        return this.children.length;
    }
    doStop(context) {
        for (const a of this.children) {
            a.stop(context);
        }
        this.children.length = 0;
    }
}
//# sourceMappingURL=action.js.map