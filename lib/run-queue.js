"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunQueue = void 0;
const action_1 = require("./action");
const utils_1 = require("./utils");
class RunQueue extends action_1.CompositeAction {
    constructor(runCount = 5, stopHandler = RunQueue.StopHandlerAuto, errHandler = utils_1.ErrHandler.RejectAllDone) {
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
            if (this.isPending()) {
                this.next();
            }
        }
        return this;
    }
    numChildren() {
        return this.children.length + this.running.length;
    }
    async doStart(context) {
        if (this.stopHandler === RunQueue.StopHandlerAuto && this.children.length <= 0) {
            return;
        }
        if (this.children.length > 0) {
            this.next();
        }
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
            action.start(this.context).watch(this.w ||
                (this.w = (action) => {
                    if (!this.isPending())
                        return this.getRP().reject();
                    let index = this.running.indexOf(action);
                    if (index >= 0) {
                        this.running.splice(index, 1);
                        if (action.isRejected()) {
                            if (!this.e)
                                this.e = action.getError();
                            if (this.errHandler === utils_1.ErrHandler.RejectImmediately)
                                return this.getRP().reject(this.e);
                        }
                    }
                    this.next();
                }), 0);
        }
        if (this.children.length === 0 && this.running.length === 0) {
            if (this.stopHandler === RunQueue.StopHandlerAuto || this.stopHandler === RunQueue.StopHandlerAutoAtLeastOnce || this.toStop) {
                this.toStop = true;
                this.done();
            }
        }
    }
    done() {
        if (this.e && this.errHandler !== utils_1.ErrHandler.Ignore) {
            this.getRP().reject(this.e);
        }
        else {
            this.getRP().resolve();
        }
    }
    doStop(context) {
        this.toStop = true;
        for (const action of this.running)
            action.stop(context);
        this.running.length = 0;
        for (const action of this.children)
            action.stop(context);
        this.children.length = 0;
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
    stopOne(a) {
        for (let i = 0; i < this.running.length; i++) {
            const action = this.running[i];
            if (typeof a === 'string' && a !== action.getName())
                continue;
            else if (a !== action)
                continue;
            this.running.splice(i, 1);
            action.stop(this.context);
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
            action.stop(this.context);
            return;
        }
    }
    addBatch(as) {
        for (let a of as) {
            this.addChild(a);
        }
        return this;
    }
    async doBatch(as, errHandler = utils_1.ErrHandler.Ignore) {
        let all = [];
        for (let a of as) {
            all.push(this.doOne(a));
        }
        await Promise.all(all);
        if (errHandler != utils_1.ErrHandler.Ignore) {
            for (let a of as) {
                if (a.isRejected())
                    return a.getError();
            }
        }
    }
    stopBatch(as) {
        for (let a of as) {
            this.stopOne(a);
        }
    }
}
exports.RunQueue = RunQueue;
RunQueue.StopHandlerManual = 0;
RunQueue.StopHandlerAuto = 1;
RunQueue.StopHandlerAutoAtLeastOnce = 2;
//# sourceMappingURL=run-queue.js.map