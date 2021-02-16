import { Action } from './action';
import { RunQueue } from './run-queue';
export class RunStep extends Action {
    constructor(from = 0, step = 0, limit = 0, to = 0, onBeforeStep = undefined, handleFactory = undefined, onAfterStep = undefined, ignoreErr = true, breakWhenErr = false) {
        super();
        this.ignoreErr = true;
        this.breakWhenErr = false;
        this.endStep = false;
        this.queueName = 'child-queue';
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        this.onBeforeStep = onBeforeStep;
        this.handleFactory = handleFactory;
        this.onAfterStep = onAfterStep;
        this.ignoreErr = ignoreErr;
        this.breakWhenErr = breakWhenErr;
    }
    numChildren() {
        return this.queueAction ? this.queueAction.numChildren() : 0;
    }
    setIgnoreErr(ignoreErr) {
        this.ignoreErr = ignoreErr;
        return this;
    }
    setBreakWhenErr(breakWhenErr) {
        this.breakWhenErr = breakWhenErr;
        return this;
    }
    setQueueName(queueName) {
        this.queueName = queueName;
        return this;
    }
    setValues(from = 0, step = 0, limit = 0, to = 0, onBeforeStep, handleFactory, onAfterStep) {
        this.from = from;
        this.step = step;
        this.limit = limit;
        this.to = to;
        this.onBeforeStep = onBeforeStep;
        this.handleFactory = handleFactory;
        this.onAfterStep = onAfterStep;
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
            this.queueAction = new RunQueue(0, 'auto', this.ignoreErr, this.breakWhenErr);
            this.queueAction.setName(this.getChildName(this.queueAction, this.queueName));
            if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
                stepOptions.to = stepOptions.from + (this.limit - count) - 1;
            }
            count += stepOptions.to - stepOptions.from + 1;
            stepOptions.count = count;
            for (let i = stepOptions.from; i <= stepOptions.to; i++) {
                this.queueAction.addChild(this.handleFactory(i, stepOptions, this, context));
            }
            await this.queueAction.startAsync(context);
            if (!this.isPending())
                break;
            if (!this.ignoreErr && this.queueAction.isRejected()) {
                if (!this.breakWhenErr) {
                    if (!err)
                        err = this.queueAction.getResult().err;
                }
                else {
                    throw this.queueAction.getResult().err;
                }
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
        if (err)
            throw err;
    }
    async doStop(context) {
        if (this.queueAction)
            this.queueAction.stop(context);
        super.doStop(context);
    }
}
//# sourceMappingURL=run-step.js.map