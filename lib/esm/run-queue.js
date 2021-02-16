import { Action } from './action';
export class RunQueue extends Action {
    constructor(runCount = 10, closeMode = 'manual', ignoreErr = true, breakWhenErr = false, ...as) {
        super();
        this.closeMode = 'manual';
        this.ignoreErr = true;
        this.breakWhenErr = false;
        this.runCount = 10;
        this.running = [];
        this.locked = false;
        this.runCount = runCount;
        this.closeMode = closeMode;
        this.ignoreErr = ignoreErr;
        this.breakWhenErr = breakWhenErr;
        this.children = [];
        if (as && as.length > 0)
            this.addChild(...as);
    }
    setRunCount(runCount) {
        this.runCount = runCount;
        return this;
    }
    setCloseMode(closeMode) {
        this.closeMode = closeMode;
        return this;
    }
    setIgnoreErr(ignoreErr) {
        this.ignoreErr = ignoreErr;
        return this;
    }
    setBreakWhenErr(breakWhenErr) {
        this.breakWhenErr = breakWhenErr;
        return this;
    }
    numChildren() {
        return super.numChildren() + this.running.length;
    }
    addChild(...as) {
        if ((this.isIdle() || this.isPending()) && !this.locked) {
            super.addChild(...as);
            if (this.isPending())
                this.next();
        }
        return this;
    }
    lock() {
        this.locked = true;
    }
    isLocked() {
        return this.locked;
    }
    async doStart(context) {
        if (this.closeMode === 'auto' && this.children.length <= 0) {
            this.locked = true;
            return Promise.resolve();
        }
        this.qp = Action.defer();
        this.next();
        return this.qp.p;
    }
    next() {
        if (!this.isPending()) {
            if (this.qp)
                this.qp.reject(this.result.err || new Error('is not pending'));
            return;
        }
        while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
            const action = this.children.shift();
            if (!action.isIdle())
                continue;
            this.running.push(action);
            action.start(this.result.context).watchFinally((result) => {
                if (!this.isPending()) {
                    this.qp.reject(this.err || result.err || this.result.err || new Error('is not pending'));
                    return;
                }
                const index = this.running.indexOf(action);
                if (index >= 0)
                    this.running.splice(index, 1);
                Action.logResult(result);
                if (action.isRejected() && this.closeMode === 'auto') {
                    if (!this.err)
                        this.err = result.err;
                    if (this.breakWhenErr) {
                        if (this.children.length > 0 || this.running.length > 0) {
                            this.locked = true;
                            for (const action of this.running)
                                action.stop(this.result.context);
                            this.running.length = 0;
                            for (const action of this.children)
                                action.stop(this.result.context);
                            this.children.length = 0;
                        }
                        this.qp.reject(this.err);
                        return;
                    }
                }
                this.next();
            });
        }
        if (this.children.length === 0 && this.running.length === 0) {
            if ((this.closeMode === 'manual' && this.locked) || this.closeMode === 'auto') {
                this.locked = true;
                if (this.err && !this.ignoreErr) {
                    this.qp.reject(this.err);
                }
                else {
                    this.qp.resolve();
                }
            }
        }
    }
    async doStop(context) {
        this.locked = true;
        for (const action of this.running)
            action.stop(context);
        this.running.length = 0;
        for (const action of this.children)
            action.stop(context);
        this.children.length = 0;
        if (this.qp)
            this.qp.reject(this.result.err || new Error('stopped'));
    }
    async do(action, context) {
        if ((this.isIdle() || this.isPending()) && !this.locked) {
            return new Promise((resolve) => {
                if (context)
                    action.setContext(context);
                action.watchFinally((result) => resolve(result));
                super.addChild(action);
                this.next();
            });
        }
    }
    stopOne(a, context) {
        for (let i = 0; i < this.running.length; i++) {
            const action = this.running[i];
            if (typeof a === 'number' && a !== action.getID())
                continue;
            else if (typeof a === 'string' && a !== action.getName())
                continue;
            else if (a !== action)
                continue;
            this.running.splice(i, 1);
            action.stop(context || this.result.context);
            this.next();
            return;
        }
        for (let i = 0; i < this.children.length; i++) {
            const action = this.running[i];
            if (typeof a === 'number' && a !== action.getID())
                continue;
            else if (typeof a === 'string' && a !== action.getName())
                continue;
            else if (a !== action)
                continue;
            this.children.splice(i, 1);
            action.stop(context || this.result.context);
            return;
        }
    }
}
//# sourceMappingURL=run-queue.js.map