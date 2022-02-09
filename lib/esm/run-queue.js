import { Action, CompositeAction } from './action';
export class RunQueue extends CompositeAction {
    closeMode = 'manual';
    runCount = 10;
    running = [];
    qp;
    locked = false;
    err;
    constructor(runCount = 10, closeMode = 'manual', handleErr = 1, ...as) {
        super(handleErr, ...as);
        this.name = 'run-queue';
        this.runCount = runCount;
        this.closeMode = closeMode;
        this.qp = Action.defer();
    }
    setRunCount(runCount) {
        this.runCount = runCount;
        return this;
    }
    setCloseMode(closeMode) {
        this.closeMode = closeMode;
        return this;
    }
    addChild(...as) {
        if ((this.isIdle() || this.isPending()) && !this.locked) {
            super.addChild(...as);
            if (this.isPending())
                this.next();
        }
        return this;
    }
    numChildren() {
        return this.children.length + this.running.length;
    }
    lock() {
        this.locked = true;
        if (this.isIdle())
            this.stop();
        else if (this.isPending() && this.children.length === 0 && this.running.length === 0)
            this.stop();
    }
    async doStart(context) {
        if (this.closeMode === 'auto' && this.children.length <= 0) {
            this.qp.resolve();
            return;
        }
        this.next();
        await this.qp.p;
    }
    next() {
        if (!this.isPending()) {
            this.qp.reject();
            return;
        }
        let w;
        while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
            const action = this.children.shift();
            if (!action.isIdle())
                continue;
            this.running.push(action);
            action.start(this.result.context).watchFinally(w ||
                (w = (result) => {
                    if (!this.isPending()) {
                        this.qp.reject();
                        return;
                    }
                    const index = this.running.indexOf(result.action);
                    if (index >= 0)
                        this.running.splice(index, 1);
                    if (result.action.isRejected()) {
                        if (!this.err)
                            this.err = result.err;
                        if (this.closeMode === 'auto' && this.handleErr === 2) {
                            this.qp.reject(this.err);
                            return;
                        }
                    }
                    this.next();
                }));
        }
        if (this.children.length === 0 && this.running.length === 0) {
            if ((this.closeMode === 'manual' && this.locked) || this.closeMode === 'auto') {
                this.locked = true;
                if (this.err && this.handleErr > 0) {
                    this.qp.reject(this.err);
                }
                else {
                    this.qp.resolve();
                }
            }
        }
    }
    doStop(context) {
        this.locked = true;
        for (const action of this.running)
            action.stop(context);
        this.running.length = 0;
        for (const action of this.children)
            action.stop(context);
        this.children.length = 0;
        this.qp.reject();
    }
    async doOne(action, context) {
        if ((this.isIdle() || this.isPending()) && !this.locked) {
            let p = new Promise((resolve) => {
                if (context)
                    action.setContext(context);
                action.watchFinally((result) => resolve(result));
            });
            super.addChild(action);
            if (this.isPending())
                this.next();
            await p;
        }
        return action.getResult();
    }
    stopOne(a, context) {
        for (let i = 0; i < this.running.length; i++) {
            const action = this.running[i];
            if (typeof a === 'string' && a !== action.getName())
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
            if (typeof a === 'string' && a !== action.getName())
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