export class Action {
    constructor() {
        this.status = Action.StatusIdle;
        this.name = 'action';
        this.result = { action: this };
    }
    static defer() {
        const d = {};
        d.p = new Promise((resolve, reject) => {
            d.resolve = resolve;
            d.reject = reject;
        });
        return d;
    }
    setName(name) {
        this.name = name;
        return this;
    }
    getName() {
        return this.name;
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
    watchResolved(watcher) {
        (this.watchers || (this.watchers = [])).push({ w: watcher, type: 'resolve' });
        return this;
    }
    watchRejected(watcher) {
        (this.watchers || (this.watchers = [])).push({ w: watcher, type: 'reject' });
        return this;
    }
    watchFinally(watcher) {
        (this.watchers || (this.watchers = [])).push({ w: watcher, type: 'finally' });
        return this;
    }
    watchFinallyAtFirst(watcher) {
        (this.watchers || (this.watchers = [])).unshift({ w: watcher, type: 'finally' });
        return this;
    }
    logErr() {
        if (this.context && this.context.logger && (!this.context.errs || this.context.errs.indexOf(this.result.err) < 0)) {
            (this.context.errs || (this.context.errs = [])).push(this.result.err);
            this.context.logger('error', this.result.err, this.result);
        }
    }
    dispatch(type) {
        for (let w of this.watchers) {
            if (w.type === type || w.type === 'finally')
                w.w(this.result);
        }
        this.watchers = undefined;
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
                if (data && this.name && this.context)
                    (this.context.datas || (this.context.datas = {}))[this.name] = data;
                if (this.watchers)
                    this.dispatch('resolve');
            }
            else {
                this.result.err = data;
                this.status = Action.StatusRejected;
                this.doStop(this.result.context);
                this.logErr();
                if (this.watchers)
                    this.dispatch('reject');
            }
        };
        const cat = (err) => {
            if (!this.isPending())
                return;
            this.result.err = err || new Error('rejected');
            this.status = Action.StatusRejected;
            this.doStop(this.result.context);
            this.logErr();
            if (this.watchers)
                this.dispatch('reject');
        };
        this.doStart(this.result.context).then(then, cat);
        return this;
    }
    doStart(context) {
        return Promise.resolve();
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
            this.logErr();
            if (this.watchers)
                this.dispatch('reject');
        }
        return this;
    }
    doStop(context) { }
}
Action.StatusIdle = 'idle';
Action.StatusPending = 'pending';
Action.StatusResolved = 'resolved';
Action.StatusRejected = 'rejected';
Action.StatusStopped = 'stopped';
Action.isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
export class CompositeAction extends Action {
    constructor(handleErr = 0, ...as) {
        super();
        this.children = [];
        this.handleErr = 0;
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