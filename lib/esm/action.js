import { ActionStatus, defer, ErrHandler, isError } from './utils';
export class Action {
    constructor() {
        this.status = ActionStatus.Idle;
    }
    setContext(context) {
        this.context = context;
        return this;
    }
    getContext() {
        return this.context;
    }
    setName(name) {
        this.name = name;
        return this;
    }
    getName() {
        return this.name;
    }
    getFullName(ln = '/') {
        if (this.parent) {
            let pn = this.parent.getFullName(ln);
            if (pn) {
                return !this.name ? pn : `${pn}${ln}${this.name}`;
            }
        }
        return this.name;
    }
    getData() {
        return this.data;
    }
    getError() {
        return this.error;
    }
    isIdle() {
        return this.status === ActionStatus.Idle;
    }
    isPending() {
        return this.status === ActionStatus.Pending;
    }
    isResolved() {
        return this.status === ActionStatus.Resolved;
    }
    isRejected() {
        return this.status === ActionStatus.Rejected;
    }
    isStopped() {
        return this.status === ActionStatus.Stopped;
    }
    watch(w, index = -1) {
        let ws = this.watchers || (this.watchers = []);
        if (index < 0)
            ws.push(w);
        else if (!ws[index])
            ws[index] = w;
        else {
            ws.splice(index, 0, w);
        }
        return this;
    }
    getRP() {
        return this.rp || (this.rp = defer());
    }
    endRP(reject = true, data) {
        if (this.rp)
            reject ? this.rp.reject(data) : this.rp.resolve(data);
    }
    logData() {
        if (this.data && this.context && this.name) {
            (this.context.datas || (this.context.datas = {}))[this.name] = this.data;
        }
    }
    logErr() {
        if (this.context && (!this.context.errs || this.context.errs.indexOf(this.error) < 0)) {
            (this.context.errs || (this.context.errs = [])).push(this.error);
            if (this.context.logger)
                this.context.logger('error', this.error, this);
        }
    }
    dispatch() {
        if (!this.watchers)
            return;
        for (let w of this.watchers) {
            if (w)
                w(this, this.context, this.data, this.error);
        }
        this.watchers.length = 0;
    }
    start(context) {
        if (!this.isIdle())
            return this;
        let ctx = this.context || context;
        this.status = ActionStatus.Pending;
        this.doStart(ctx).then((data) => {
            if (!this.isPending())
                return;
            if (data instanceof Action) {
                let a = data;
                data = a.isResolved() ? a.getData() : a.getError() || new Error('unknown');
            }
            if (!isError(data)) {
                this.data = data;
                this.status = ActionStatus.Resolved;
                this.doStop(ctx);
                this.logData();
                this.dispatch();
            }
            else {
                this.error = data;
                this.status = ActionStatus.Rejected;
                this.doStop(ctx);
                this.logErr();
                this.dispatch();
            }
        }, (err) => {
            if (!this.isPending())
                return;
            this.error = err;
            this.status = ActionStatus.Rejected;
            this.doStop(ctx);
            this.logErr();
            this.dispatch();
        });
        return this;
    }
    async doStart(context) {
        return Promise.resolve();
    }
    async startAsync(context) {
        if (this.isIdle()) {
            const p = new Promise((resolve) => this.watch(resolve));
            this.start(context);
            await p;
        }
        return this;
    }
    stop(context) {
        if (this.isIdle() || this.isPending()) {
            let isPending = this.isPending();
            this.status = ActionStatus.Stopped;
            if (isPending)
                this.doStop(this.context || context);
            this.dispatch();
        }
        return this;
    }
    doStop(context) {
        this.endRP();
    }
}
export class CompositeAction extends Action {
    constructor(errHandler = ErrHandler.Ignore) {
        super();
        this.children = [];
        this.errHandler = ErrHandler.Ignore;
        this.errHandler = errHandler;
    }
    setErrHandler(errHandler) {
        this.errHandler = errHandler;
        return this;
    }
    addChild(a) {
        this.children.push(a);
        a.parent = this;
        return this;
    }
    numChildren() {
        return this.children.length;
    }
    doStop(context) {
        for (const a of this.children)
            a.stop(context);
        this.children.length = 0;
        this.endRP();
    }
}
//# sourceMappingURL=action.js.map