import { CompositeAction } from './action';
import { ErrHandler } from './utils';
export class RunQueue extends CompositeAction {
    constructor(runCount = 5, stopHandler = RunQueue.StopHandlerAuto, errHandler = ErrHandler.RejectAllDone) {
        super(errHandler);
        this.stopHandler = RunQueue.StopHandlerAuto;
        this.runCount = 5;
        this.running = [];
        this.toStop = false;
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
            return this.getRP().reject();
        while (this.children.length > 0 && (this.runCount <= 0 || this.running.length < this.runCount)) {
            const action = this.children.shift();
            if (!action.isIdle())
                continue;
            this.running.push(action);
            action.start(this.context).then(this.w ||
                (this.w = (action) => {
                    if (!this.isPending())
                        return this.getRP().reject();
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
            if (this.stopHandler === RunQueue.StopHandlerAuto || this.stopHandler === RunQueue.StopHandlerAutoAtLeastOnce || this.toStop) {
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
            else if (a !== action)
                continue;
            this.running.splice(i, 1);
            await action.stop(this.context);
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
        if (errHandler != ErrHandler.Ignore) {
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
RunQueue.StopHandlerManual = 0;
RunQueue.StopHandlerAuto = 1;
RunQueue.StopHandlerAutoAtLeastOnce = 2;
//# sourceMappingURL=run-queue.js.map