"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompositeAction = exports.Action = void 0;
const utils_1 = require("./utils");
class Action {
    constructor() {
        this.status = utils_1.ActionStatus.Idle;
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
        return this.status === utils_1.ActionStatus.Idle;
    }
    isPending() {
        return this.status === utils_1.ActionStatus.Pending;
    }
    isResolved() {
        return this.status === utils_1.ActionStatus.Resolved;
    }
    isRejected() {
        return this.status === utils_1.ActionStatus.Rejected;
    }
    isStopped() {
        return this.status === utils_1.ActionStatus.Stopped;
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
        return this.rp || (this.rp = (0, utils_1.defer)());
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
        this.context = this.context || context;
        this.status = utils_1.ActionStatus.Pending;
        this.doStart(this.context).then((data) => {
            if (!this.isPending())
                return;
            if (data instanceof Action) {
                let a = data;
                data = a.isResolved() ? a.getData() : a.getError() || new Error('unknown');
            }
            if (!(0, utils_1.isError)(data)) {
                this.data = data;
                this.status = utils_1.ActionStatus.Resolved;
                this.doStop(this.context);
                this.logData();
                this.dispatch();
            }
            else {
                this.error = data;
                this.status = utils_1.ActionStatus.Rejected;
                this.doStop(this.context);
                this.logErr();
                this.dispatch();
            }
        }, (err) => {
            if (!this.isPending())
                return;
            this.error = err;
            this.status = utils_1.ActionStatus.Rejected;
            this.doStop(this.context);
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
            this.status = utils_1.ActionStatus.Stopped;
            if (isPending) {
                this.context = this.context || context;
                this.doStop(this.context);
            }
            this.dispatch();
        }
        return this;
    }
    doStop(context) {
        this.endRP();
    }
}
exports.Action = Action;
class CompositeAction extends Action {
    constructor(errHandler = utils_1.ErrHandler.Ignore) {
        super();
        this.children = [];
        this.errHandler = utils_1.ErrHandler.Ignore;
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
exports.CompositeAction = CompositeAction;
//# sourceMappingURL=action.js.map