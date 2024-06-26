"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunStep = void 0;
const action_1 = require("./action");
const action_func_1 = require("./action-func");
const run_queue_1 = require("./run-queue");
const utils_1 = require("./utils");
class RunStep extends action_1.CompositeAction {
    constructor(from = 0, step = 0, limit = 0, to = 0, onBeforeStep, handlerFactory, onAfterStep, errHandler = utils_1.ErrHandler.RejectAllDone) {
        super(errHandler);
        this.toStop = false;
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
            const range = { from: current, to: this.to, count };
            if (this.step > 0) {
                range.to = Math.min(current + this.step - 1, this.to);
            }
            if (this.limit > 0 && this.limit - count < range.to - range.from + 1) {
                range.to = range.from + (this.limit - count) - 1;
            }
            if (this.onBeforeStep)
                await this.onBeforeStep(context, range, this);
            if (!this.isPending())
                break;
            if (this.toStop) {
                if (this.onAfterStep)
                    await this.onAfterStep(context, range, this);
                break;
            }
            range.count = count = count + (range.to - range.from + 1);
            this.queueAction = new run_queue_1.RunQueue(0, run_queue_1.RunQueue.StopHandlerAuto, this.errHandler);
            this.queueAction.parent = this;
            if (this.queueName)
                this.queueAction.setName(this.queueName);
            for (let i = range.from; i <= range.to; i++) {
                let result = this.handlerFactory(context, i, range, this);
                let af;
                let a;
                if (result instanceof Promise)
                    af = await result;
                else
                    af = result;
                if (af instanceof action_1.Action)
                    a = result;
                else
                    a = new action_func_1.ActionForFunc(af);
                this.queueAction.addChild(a);
            }
            await this.queueAction.start(context);
            if (!this.isPending())
                break;
            if (this.queueAction.isRejected()) {
                if (!e)
                    e = this.queueAction.getError();
                if (this.errHandler === utils_1.ErrHandler.RejectImmediately)
                    throw e;
            }
            this.queueAction = undefined;
            if (this.onAfterStep)
                await this.onAfterStep(context, range, this);
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
        if (e && this.errHandler !== utils_1.ErrHandler.Ignore)
            throw e;
    }
    async doStop(context) {
        if (this.queueAction)
            await this.queueAction.stop(context);
        await super.doStop(context);
    }
}
exports.RunStep = RunStep;
//# sourceMappingURL=run-step.js.map