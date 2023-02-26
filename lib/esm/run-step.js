import { CompositeAction } from './action';
import { RunQueue } from './run-queue';
import { ErrHandler } from './utils';
export class RunStep extends CompositeAction {
    constructor(from = 0, step = 0, limit = 0, to = 0, onBeforeStep, handlerFactory, onAfterStep, errHandler = ErrHandler.RejectAllDone) {
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
            const stepOptions = { from: current, to: this.to, count };
            if (this.step > 0)
                stepOptions.to = Math.min(current + this.step - 1, this.to);
            if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
                stepOptions.to = stepOptions.from + (this.limit - count) - 1;
            }
            if (this.onBeforeStep)
                await this.onBeforeStep(context, this, stepOptions);
            if (!this.isPending())
                break;
            if (this.toStop) {
                if (this.onAfterStep)
                    await this.onAfterStep(context, this, stepOptions);
                break;
            }
            stepOptions.count = count = count + (stepOptions.to - stepOptions.from + 1);
            this.queueAction = new RunQueue(0, RunQueue.StopHandlerAuto, this.errHandler);
            this.queueAction.parent = this;
            if (this.queueName)
                this.queueAction.setName(this.queueName);
            for (let i = stepOptions.from; i <= stepOptions.to; i++) {
                this.queueAction.addChild(this.handlerFactory(i, context, this, stepOptions));
            }
            await this.queueAction.startAsync(context);
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
                await this.onAfterStep(context, this, stepOptions);
            if (!this.isPending())
                break;
            if (this.toStop)
                break;
            if (this.limit > 0 && count >= this.limit)
                break;
            current = stepOptions.to + 1;
            if (current > this.to)
                break;
        }
        if (e && this.errHandler !== ErrHandler.Ignore)
            throw e;
    }
    doStop(context) {
        if (this.queueAction)
            this.queueAction.stop(context);
        super.doStop(context);
    }
}
//# sourceMappingURL=run-step.js.map