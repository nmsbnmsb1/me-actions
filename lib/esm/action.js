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
        return this.name || '';
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
    endRP(resolve = true, data) {
        if (this.rp) {
            resolve ? this.rp.resolve(data) : this.rp.reject(data || new Error('end runtime promise'));
        }
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
    async start(context) {
        if (this.isIdle()) {
            let data;
            try {
                this.context = this.context || context;
                this.status = ActionStatus.Pending;
                data = await this.doStart(this.context);
                if (data instanceof Action) {
                    let a = data;
                    data = a.isResolved() ? a.getData() : a.getError() || new Error('unknown');
                }
            }
            catch (err) {
                data = err;
            }
            if (this.isPending()) {
                if (!isError(data)) {
                    this.data = data;
                    this.status = ActionStatus.Resolved;
                }
                else {
                    this.error = data;
                    this.status = ActionStatus.Rejected;
                }
                await this.doStop(this.context);
                if (this.rp)
                    this.endRP(true);
                this.logData();
                this.dispatch();
            }
        }
        return this;
    }
    async doStart(context) {
        return null;
    }
    async stop(context) {
        if (this.isIdle() || this.isPending()) {
            let isPending = this.isPending();
            this.status = ActionStatus.Stopped;
            if (isPending) {
                this.context = this.context || context;
                await this.doStop(this.context);
                if (this.rp)
                    this.endRP(true);
            }
            this.dispatch();
        }
        return this;
    }
    async doStop(context) {
        return null;
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
    addChildren(as) {
        for (let a of as) {
            this.children.push(a);
            a.parent = this;
        }
        return this;
    }
    numChildren() {
        return this.children.length;
    }
    async doStop(context) {
        if (this.children.length > 0) {
            let all = [];
            for (const a of this.children)
                all.push(a.stop(context));
            await Promise.all(all);
        }
        this.children.length = 0;
    }
}
//# sourceMappingURL=action.js.map