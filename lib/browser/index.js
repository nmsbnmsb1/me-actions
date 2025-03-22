const isError = (e) => Object.prototype.toString.call(e) === '[object Error]' || e instanceof Error;
const defer = () => {
    const d = {};
    d.p = new Promise((resolve, reject) => {
        d.resolve = resolve;
        d.reject = reject;
    });
    return d;
};
const ActionStatus = {
    Idle: 0,
    Pending: 1,
    Resolved: 2,
    Rejected: 3,
    Stopped: 4,
};
const ErrHandler = {
    Ignore: 0,
    RejectImmediately: 1,
    RejectAllDone: 2,
};

class Action {
    parent;
    context;
    name;
    status = ActionStatus.Idle;
    data;
    error;
    watchers;
    rp;
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
    getFullName(ln = '/', showAll = false) {
        let name = this.name || (showAll ? '..' : '');
        if (this.parent) {
            let pn = this.parent.getFullName(ln, showAll);
            if (pn) {
                return !name ? pn : `${pn}${ln}${name}`;
            }
        }
        return name;
    }
    getData() {
        return this.data;
    }
    getError() {
        return this.error;
    }
    getStatus() {
        return this.status;
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
            if (this.context.logger) {
                this.context.logger('error', this.error, this, this.context);
            }
        }
    }
    async dispatch() {
        if (!this.watchers)
            return;
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
                data = isError(err) ? err : new Error(err);
            }
            if (this.isPending()) {
                if (!isError(data)) {
                    this.data = data;
                    this.status = ActionStatus.Resolved;
                    this.logData();
                }
                else {
                    this.error = data;
                    this.status = ActionStatus.Rejected;
                    this.logErr();
                }
                await this.doStop(this.context);
                if (this.rp)
                    this.endRP(true);
                await this.dispatch();
            }
        }
        return this;
    }
    async doStart(context) {
        return;
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
            await this.dispatch();
        }
        return this;
    }
    async doStop(context) {
        return;
    }
}
class CompositeAction extends Action {
    children = [];
    errHandler = ErrHandler.Ignore;
    constructor(errHandler = ErrHandler.Ignore) {
        super();
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

class ActionForFunc extends Action {
    innerDoStart;
    innerDoStop;
    constructor(doStart, doStop) {
        super();
        this.innerDoStart = doStart;
        this.innerDoStop = doStop;
    }
    setDoStart(f) {
        this.innerDoStart = f;
        return this;
    }
    setDoStop(f) {
        this.innerDoStop = f;
        return this;
    }
    async doStart(context) {
        return this.innerDoStart(this, context);
    }
    async doStop(context) {
        if (this.innerDoStop)
            return this.innerDoStop(this, context);
    }
}

class ActionForSleep extends Action {
    timeout;
    timer;
    constructor(timeout) {
        super();
        this.timeout = timeout;
    }
    async doStart() {
        let rp = this.getRP();
        this.timer = setTimeout(rp.resolve, this.timeout);
        await rp.p;
    }
    async doStop() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = undefined;
    }
}

class RunAll extends CompositeAction {
    async doStart(context) {
        if (this.children.length <= 0)
            return;
        let rp = this.getRP();
        let total = this.children.length;
        let count = 0;
        let w;
        let e;
        for (let action of this.children) {
            action.start(context).then(w ||
                (w = (action) => {
                    if (!this.isPending())
                        return rp.reject(new Error("It's not pending"));
                    count++;
                    if (action.isRejected()) {
                        if (!e)
                            e = action.getError();
                        if (this.errHandler === ErrHandler.RejectImmediately)
                            return rp.reject(e);
                    }
                    if (count >= total) {
                        if (e && this.errHandler === ErrHandler.RejectAllDone)
                            rp.reject(e);
                        else
                            rp.resolve();
                    }
                }));
        }
        await rp.p;
    }
}

class RunOne extends CompositeAction {
    async doStart(context) {
        let e;
        while (this.children.length > 0) {
            let action = this.children.shift();
            await action.start(context);
            if (this.isPending() && action.isRejected()) {
                if (this.errHandler === ErrHandler.RejectImmediately)
                    throw action.getError();
                if (!e) {
                    e = action.getError();
                }
            }
        }
        if (e && this.errHandler === ErrHandler.RejectAllDone)
            throw e;
    }
}

class RunQueue extends CompositeAction {
    static StopHandlerManual = 0;
    static StopHandlerAuto = 1;
    static StopHandlerAutoAtLeastOnce = 2;
    stopHandler = RunQueue.StopHandlerAuto;
    runCount = 5;
    running = [];
    w;
    e;
    toStop = false;
    constructor(runCount = 5, stopHandler = RunQueue.StopHandlerAuto, errHandler = ErrHandler.RejectAllDone) {
        super(errHandler);
        this.runCount = runCount;
        this.stopHandler = stopHandler;
    }
    setRunCount(runCount) {
        this.runCount = runCount;
        return this;
    }
    setStopHandler(stopHandler) {
        this.stopHandler = stopHandler;
        return this;
    }
    setToStop() {
        this.toStop = true;
        if (this.isIdle()) {
            this.stop();
        }
        else if (this.isPending() && this.children.length === 0 && this.running.length === 0) {
            this.done();
        }
    }
    addChild(a) {
        if ((this.isIdle() || this.isPending()) && !this.toStop) {
            super.addChild(a);
            if (this.isPending())
                this.next();
        }
        return this;
    }
    numChildren() {
        return this.children.length + this.running.length;
    }
    async doStart(context) {
        if (this.stopHandler === RunQueue.StopHandlerAuto && this.children.length <= 0)
            return;
        if (this.children.length > 0)
            this.next();
        await this.getRP().p;
    }
    next() {
        if (!this.isPending())
            return this.getRP().reject(new Error("It's not pending"));
        while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
            let action = this.children.shift();
            if (!action.isIdle())
                continue;
            this.running.push(action);
            action.start(this.context).then(this.w ||
                (this.w = (action) => {
                    if (!this.isPending())
                        return this.getRP().reject(new Error("It's not pending"));
                    let index = this.running.indexOf(action);
                    if (index >= 0) {
                        this.running.splice(index, 1);
                        if (action.isRejected()) {
                            if (!this.e)
                                this.e = action.getError();
                            if (this.errHandler === ErrHandler.RejectImmediately)
                                return this.getRP().reject(this.e);
                        }
                    }
                    this.next();
                }));
        }
        if (this.children.length === 0 && this.running.length === 0) {
            if (this.stopHandler === RunQueue.StopHandlerAuto ||
                this.stopHandler === RunQueue.StopHandlerAutoAtLeastOnce ||
                this.toStop) {
                this.toStop = true;
                this.done();
            }
        }
    }
    done() {
        if (this.e && this.errHandler !== ErrHandler.Ignore) {
            this.getRP().reject(this.e);
        }
        else {
            this.getRP().resolve();
        }
    }
    async doStop(context) {
        this.toStop = true;
        let all = [];
        for (const action of this.running)
            all.push(action.stop(context));
        this.running.length = 0;
        for (const action of this.children)
            all.push(action.stop(context));
        this.children.length = 0;
        await Promise.all(all);
    }
    addOne(a) {
        return this.addChild(a);
    }
    async doOne(a) {
        if ((this.isIdle() || this.isPending()) && !this.toStop) {
            super.addChild(a);
            let p = new Promise((resolve) => a.watch(resolve));
            if (this.isPending())
                this.next();
            await p;
        }
        return a;
    }
    async stopOne(a) {
        for (let i = 0; i < this.running.length; i++) {
            const action = this.running[i];
            if (typeof a === 'string' && a !== action.getName())
                continue;
            if (a !== action)
                continue;
            this.running.splice(i, 1);
            await action.stop(this.context);
            this.next();
            return;
        }
        for (let i = 0; i < this.children.length; i++) {
            const action = this.children[i];
            if (typeof a === 'string' && a !== action.getName())
                continue;
            if (a !== action)
                continue;
            this.children.splice(i, 1);
            await action.stop(this.context);
            return;
        }
    }
    addBatch(as) {
        for (let a of as)
            this.addChild(a);
        return this;
    }
    async doBatch(as, errHandler = ErrHandler.Ignore) {
        let all = [];
        for (let a of as)
            all.push(this.doOne(a));
        await Promise.all(all);
        if (errHandler !== ErrHandler.Ignore) {
            for (let a of as) {
                if (a.isRejected())
                    return a.getError();
            }
        }
    }
    async stopBatch(as) {
        let all = [];
        for (let a of as)
            all.push(this.stopOne(a));
        await Promise.all(all);
    }
}

class RunStep extends CompositeAction {
    from;
    step;
    limit;
    to;
    onBeforeStep;
    handlerFactory;
    onAfterStep;
    queueAction;
    queueName;
    toStop = false;
    constructor(from = 0, step = 0, limit = 0, to = 0, onBeforeStep, handlerFactory, onAfterStep, errHandler = ErrHandler.RejectAllDone) {
        super(errHandler);
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        this.onBeforeStep = onBeforeStep;
        this.handlerFactory = handlerFactory;
        this.onAfterStep = onAfterStep;
    }
    setValues(from = 0, step = 0, limit = 0, to = 0) {
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        return this;
    }
    setOnBeforeStep(fn) {
        this.onBeforeStep = fn;
        return this;
    }
    setHandlerFactory(fn) {
        this.handlerFactory = fn;
        return this;
    }
    setOnAfterStep(fn) {
        this.onAfterStep = fn;
        return this;
    }
    setQueueName(name) {
        this.queueName = name;
        return this;
    }
    setToStop() {
        this.toStop = true;
        return this;
    }
    extendLimit(limit) {
        if (limit > this.limit)
            this.limit = limit;
        return this.limit;
    }
    extendTo(to) {
        if (to > this.to)
            this.to = to;
        return this.to;
    }
    addChild(a) {
        if (this.queueAction && !this.toStop)
            this.queueAction.addChild(a);
        return this;
    }
    numChildren() {
        return this.queueAction ? this.queueAction.numChildren() : 0;
    }
    async doStart(context) {
        let count = 0;
        let e;
        let current = this.from;
        while (current <= this.to) {
            this.toStop = false;
            let range = { from: current, to: this.to, count, limit: this.limit };
            if (this.step > 0) {
                range.to = Math.min(current + this.step - 1, this.to);
            }
            if (this.limit > 0 && this.limit - count < range.to - range.from + 1) {
                range.to = range.from + (this.limit - count) - 1;
            }
            if (this.onBeforeStep)
                await this.onBeforeStep(this, context, range);
            if (!this.isPending())
                break;
            if (this.toStop) {
                if (this.onAfterStep)
                    await this.onAfterStep(this, context, range);
                break;
            }
            range.count = count = count + (range.to - range.from + 1);
            this.queueAction = new RunQueue(0, RunQueue.StopHandlerAuto, this.errHandler);
            this.queueAction.parent = this;
            if (this.queueName)
                this.queueAction.setName(this.queueName);
            for (let i = range.from; i <= range.to; i++) {
                let result = this.handlerFactory(this, context, i, range);
                let af;
                let a;
                if (result instanceof Promise)
                    af = await result;
                else
                    af = result;
                if (af instanceof Action)
                    a = result;
                else
                    a = new ActionForFunc(af);
                this.queueAction.addChild(a);
            }
            await this.queueAction.start(context);
            if (!this.isPending())
                break;
            if (this.queueAction.isRejected()) {
                if (!e)
                    e = this.queueAction.getError();
                if (this.errHandler === ErrHandler.RejectImmediately)
                    throw e;
            }
            this.queueAction = undefined;
            if (this.onAfterStep)
                await this.onAfterStep(this, context, range);
            if (!this.isPending())
                break;
            if (this.toStop)
                break;
            if (this.limit > 0 && count >= this.limit)
                break;
            current = range.to + 1;
            if (current > this.to)
                break;
        }
        if (e && this.errHandler !== ErrHandler.Ignore)
            throw e;
    }
    async doStop(context) {
        if (this.queueAction)
            await this.queueAction.stop(context);
        await super.doStop(context);
    }
}

export { Action, ActionForFunc, ActionForSleep, ActionStatus, CompositeAction, ErrHandler, RunAll, RunOne, RunQueue, RunStep, defer, isError };
//# sourceMappingURL=index.js.map
