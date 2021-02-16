let ID = 1;
export class Action {
    constructor() {
        this.id = 0;
        this.name = '';
        this.status = Action.StatusIdle;
        this.rp = Action.defer();
        this.id = ID++;
        this.name = `${this.id}(${this.id})`;
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
    getID() {
        return this.id;
    }
    setName(name) {
        if (!name.match(/\([0-9]+\)$/gm))
            name = `${name}(${this.id})`;
        this.name = name;
        return this;
    }
    getName() {
        if (!this.name.match(/\([0-9]+\)$/gm))
            this.name = `${this.name}(${this.id})`;
        return this.name;
    }
    getChildName(child, childName) {
        if (!childName)
            return `${this.getName()}/${child.getName()}`;
        return `${this.getName()}/${childName}(${this.id})`;
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
    isStopped() {
        return this.status === Action.StatusStopped;
    }
    isResolved() {
        return this.status === Action.StatusResolved;
    }
    isRejected() {
        return this.status === Action.StatusRejected || this.status === Action.StatusStopped;
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
    addChild(...as) {
        for (const a of as) {
            a.setName(this.getChildName(a));
            (this.children || (this.children = [])).push(a);
        }
        return this;
    }
    addChildWithContext(action, context) {
        return this.addChild(action.setContext(context));
    }
    numChildren() {
        return this.children ? this.children.length : 0;
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
        this.getep().p.then(watcher, Action.efn);
        this.getep().p.catch(watcher);
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
            if (Object.prototype.toString.call(data) === '[object Object]' && Object.prototype.hasOwnProperty.call(data, 'action')) {
                data = data.err || data.data;
            }
            if (!Action.isError(data)) {
                this.result.data = data;
                this.status = Action.StatusResolved;
                this.doStop(this.result.context);
                this.rp.resolve(this.result);
                if (this.ep)
                    this.ep.resolve(this.result);
            }
            else {
                this.result.err = data;
                this.status = Action.StatusRejected;
                this.doStop(this.result.context);
                this.rp.resolve(this.result);
                if (this.ep)
                    this.ep.reject(this.result);
            }
        };
        this.doStart(this.result.context).then(then, then);
        return this;
    }
    p() {
        if (!this.isIdle() && !this.isPending()) {
            return new Promise((resolve) => resolve(this.result));
        }
        return this.rp.p;
    }
    async startAsync(context) {
        return this.start(context).p();
    }
    doStart(context) {
        return Promise.resolve();
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
            this.rp.resolve(this.result);
            if (this.ep)
                this.ep.reject(this.result);
        }
        return this;
    }
    doStop(context) {
        if (this.children && this.children.length > 0) {
            for (const action of this.children)
                action.stop(context);
            this.children.length = 0;
        }
    }
}
Action.StatusIdle = 'idle';
Action.StatusPending = 'pending';
Action.StatusResolved = 'resolved';
Action.StatusRejected = 'rejected';
Action.StatusStopped = 'stopped';
Action.efn = () => { };
Action.isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
Action.logResult = (result) => {
    if (!result.context)
        return;
    const name = result.action.getName();
    if (result.action.isResolved() && result.data) {
        if (result.context.datas)
            result.context.datas[name] = result.data;
    }
    else if (result.action.isRejected() && result.err) {
        if (result.context.errs)
            result.context.errs[name] = result.err;
    }
};
//# sourceMappingURL=action.js.map