"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunStep = void 0;
const action_1 = require("./action");
const run_queue_1 = require("./run-queue");
class RunStep extends action_1.CompositeAction {
    constructor(from = 0, step = 0, limit = 0, to = 0, onBeforeStep = undefined, handlerFactory = undefined, onAfterStep = undefined, handleErr = 1) {
        super(handleErr);
        this.endStep = false;
        this.name = 'run-step';
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        this.onBeforeStep = onBeforeStep;
        this.handlerFactory = handlerFactory;
        this.onAfterStep = onAfterStep;
    }
    setQueueName(name) {
        this.queueName = name;
        return this;
    }
    setStep(step) {
        this.step = step;
        return this;
    }
    setLimit(limit) {
        this.limit = limit;
        return this;
    }
    setTo(to) {
        this.to = to;
        return this;
    }
    setValues(from = 0, step = 0, limit = 0, to = 0, onBeforeStep, handlerFactory, onAfterStep) {
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        this.onBeforeStep = onBeforeStep;
        this.handlerFactory = handlerFactory;
        this.onAfterStep = onAfterStep;
        return this;
    }
    setOnBeforeStep(fn) {
        this.onBeforeStep = fn;
        return this;
    }
    setOnAfterStep(fn) {
        this.onAfterStep = fn;
        return this;
    }
    end() {
        this.endStep = true;
        return this;
    }
    addChild(...as) {
        if (this.queueAction)
            this.queueAction.addChild(...as);
        return this;
    }
    numChildren() {
        return this.queueAction ? this.queueAction.numChildren() : 0;
    }
    async doStart(context) {
        let count = 0;
        let err;
        let current = this.from;
        while (current <= this.to) {
            const stepOptions = { from: current, to: this.step > 0 ? Math.min(current + this.step - 1, this.to) : this.to, count };
            this.endStep = false;
            if (this.onBeforeStep)
                await this.onBeforeStep(stepOptions, this, context);
            if (!this.isPending())
                break;
            if (this.endStep) {
                if (this.onAfterStep)
                    await this.onAfterStep(stepOptions, this, context);
                break;
            }
            this.queueAction = new run_queue_1.RunQueue(0, 'auto', this.handleErr);
            if (this.queueName)
                this.queueAction.setName(this.queueName);
            this.children.push(this.queueAction);
            if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
                stepOptions.to = stepOptions.from + (this.limit - count) - 1;
            }
            count += stepOptions.to - stepOptions.from + 1;
            stepOptions.count = count;
            for (let i = stepOptions.from; i <= stepOptions.to; i++) {
                this.queueAction.addChild(this.handlerFactory(i, stepOptions, this, context));
            }
            await this.queueAction.startAsync(context);
            this.children.length = 0;
            if (!this.isPending())
                break;
            if (this.queueAction.isRejected()) {
                if (!err)
                    err = this.queueAction.getResult().err;
                if (this.handleErr === 2)
                    throw err;
            }
            this.queueAction = undefined;
            if (this.onAfterStep)
                await this.onAfterStep(stepOptions, this, context);
            if (!this.isPending())
                break;
            if (this.endStep)
                break;
            if (this.limit > 0 && count >= this.limit)
                break;
            current = stepOptions.to + 1;
            if (current > this.to)
                break;
        }
        if (err && this.handleErr > 0)
            throw err;
    }
    doStop(context) {
        if (this.queueAction)
            this.queueAction.stop(context);
        super.doStop(context);
    }
}
exports.RunStep = RunStep;
//# sourceMappingURL=run-step.js.map