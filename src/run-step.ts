import { Action, CompositeAction } from './action';
import { ActionForFunc, IFunc } from './action-func';
import { RunQueue } from './run-queue';
import { ErrHandler } from './utils';

export interface IStepOptions {
	from: number;
	to: number;
	count: number;
}
export type IHandlerFactory = (i: number, stepOptions: IStepOptions, context: any, caller: RunStep) => Action | IFunc | Promise<Action | IFunc>;
export type IOnStep = (stepOptions: IStepOptions, context: any, caller: RunStep) => Promise<any>;

export class RunStep extends CompositeAction {
	protected from: number;
	protected step: number;
	protected limit: number;
	protected to: number;
	protected onBeforeStep: IOnStep;
	protected handlerFactory: IHandlerFactory;
	protected onAfterStep: IOnStep;
	//
	protected queueAction!: RunQueue;
	protected queueName: string;
	protected toStop: boolean = false;

	constructor(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep?: IOnStep,
		handlerFactory?: IHandlerFactory,
		onAfterStep?: IOnStep,
		errHandler: number = ErrHandler.RejectAllDone
	) {
		super(errHandler);
		this.from = from;
		this.step = step;
		this.limit = limit;
		this.to = to;
		this.onBeforeStep = onBeforeStep;
		this.handlerFactory = handlerFactory;
		this.onAfterStep = onAfterStep;
	}
	public setValues(from: number = 0, step: number = 0, limit: number = 0, to: number = 0) {
		this.from = from;
		this.step = step;
		this.limit = limit;
		this.to = to;
		return this;
	}
	public setOnBeforeStep(fn: IOnStep) {
		this.onBeforeStep = fn;
		return this;
	}
	public setHandlerFactory(fn: IHandlerFactory) {
		this.handlerFactory = fn;
		return this;
	}
	public setOnAfterStep(fn: IOnStep) {
		this.onAfterStep = fn;
		return this;
	}
	public setQueueName(name: string) {
		this.queueName = name;
		return this;
	}
	public setToStop() {
		this.toStop = true;
		return this;
	}
	//
	public addChild(a: Action) {
		if (this.queueAction && !this.toStop) this.queueAction.addChild(a);
		return this;
	}
	public numChildren() {
		return this.queueAction ? this.queueAction.numChildren() : 0;
	}
	//
	protected async doStart(context: any) {
		let count = 0;
		let e: Error;
		let current = this.from;
		while (current <= this.to) {
			this.toStop = false;
			//1,3,5,10
			const stepOptions: IStepOptions = { from: current, to: this.to, count };
			//截断
			if (this.step > 0) stepOptions.to = Math.min(current + this.step - 1, this.to);
			//截断
			if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
				stepOptions.to = stepOptions.from + (this.limit - count) - 1;
			}

			// before
			if (this.onBeforeStep) await this.onBeforeStep(stepOptions, context, this);
			if (!this.isPending()) break;
			if (this.toStop) {
				if (this.onAfterStep) await this.onAfterStep(stepOptions, context, this);
				break;
			}

			// pending
			stepOptions.count = count = count + (stepOptions.to - stepOptions.from + 1);
			//
			this.queueAction = new RunQueue(0, RunQueue.StopHandlerAuto, this.errHandler);
			(this.queueAction as any).parent = this;
			if (this.queueName) this.queueAction.setName(this.queueName);
			for (let i = stepOptions.from; i <= stepOptions.to; i++) {
				let result = this.handlerFactory(i, stepOptions, context, this);
				let af: Action | IFunc;
				let a: Action;
				//
				if (result instanceof Promise) af = await result;
				else af = result;
				if (af instanceof Action) a = result as Action;
				else a = new ActionForFunc(af);
				//
				this.queueAction.addChild(a);
				// console.log(i, options);
				// if (this.limit > 0 && count >= this.limit) { options.to = i; break; }
			}
			await this.queueAction.startAsync(context);
			//
			if (!this.isPending()) break;
			if (this.queueAction.isRejected()) {
				if (!e) e = this.queueAction.getError();
				if (this.errHandler === ErrHandler.RejectImmediately) throw e;
			}
			this.queueAction = undefined;

			// after
			if (this.onAfterStep) await this.onAfterStep(stepOptions, context, this);
			if (!this.isPending()) break;
			if (this.toStop) break;
			if (this.limit > 0 && count >= this.limit) break;
			//
			current = stepOptions.to + 1;
			if (current > this.to) break;
		}
		// console.log("done");
		if (e && this.errHandler !== ErrHandler.Ignore) throw e;
	}

	protected doStop(context: any) {
		if (this.queueAction) this.queueAction.stop(context);
		super.doStop(context);
	}
}
