import { Action, CompositeAction } from './action';
import { ActionForFunc, Func } from './action-func';
import { RunQueue } from './run-queue';
import { ErrHandler } from './utils';

export interface StepRange { from: number; to: number; count: number; }
export type StepHandlerFactory = (context: any, i: number, range: StepRange, caller: RunStep) => Action | Func | Promise<Action | Func>;
export type OnStep = (context: any, range: StepRange, caller: RunStep) => Promise<any>;

export class RunStep extends CompositeAction {
	protected from: number;
	protected step: number;
	protected limit: number;
	protected to: number;
	protected onBeforeStep: OnStep;
	protected handlerFactory: StepHandlerFactory;
	protected onAfterStep: OnStep;
	//
	protected queueAction!: RunQueue;
	protected queueName: string;
	protected toStop: boolean = false;

	constructor(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep?: OnStep,
		handlerFactory?: StepHandlerFactory,
		onAfterStep?: OnStep,
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
	public setOnBeforeStep(fn: OnStep) {
		this.onBeforeStep = fn;
		return this;
	}
	public setHandlerFactory(fn: StepHandlerFactory) {
		this.handlerFactory = fn;
		return this;
	}
	public setOnAfterStep(fn: OnStep) {
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
	public extendLimit(limit: number) {
		if (limit > this.limit) this.limit = limit;
		return this.limit;
	}
	public extendTo(to: number) {
		if (to > this.to) this.to = to;
		return this.to;
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
			const range: StepRange = { from: current, to: this.to, count };
			//截断
			if (this.step > 0) {
				range.to = Math.min(current + this.step - 1, this.to);
			}
			//截断
			if (this.limit > 0 && this.limit - count < range.to - range.from + 1) {
				range.to = range.from + (this.limit - count) - 1;
			}

			// before
			if (this.onBeforeStep) await this.onBeforeStep(context, range, this);
			if (!this.isPending()) break;
			if (this.toStop) {
				if (this.onAfterStep) await this.onAfterStep(context, range, this);
				break;
			}

			// pending
			range.count = count = count + (range.to - range.from + 1);
			//
			this.queueAction = new RunQueue(0, RunQueue.StopHandlerAuto, this.errHandler);
			(this.queueAction as any).parent = this;
			if (this.queueName) this.queueAction.setName(this.queueName);
			for (let i = range.from; i <= range.to; i++) {
				let result = this.handlerFactory(context, i, range, this);
				let af: Action | Func;
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
			await this.queueAction.start(context);
			//
			if (!this.isPending()) break;
			if (this.queueAction.isRejected()) {
				if (!e) e = this.queueAction.getError();
				if (this.errHandler === ErrHandler.RejectImmediately) throw e;
			}
			this.queueAction = undefined;

			// after
			if (this.onAfterStep) await this.onAfterStep(context, range, this);
			if (!this.isPending()) break;
			if (this.toStop) break;
			if (this.limit > 0 && count >= this.limit) break;
			//
			current = range.to + 1;
			if (current > this.to) break;
		}
		// console.log("done");
		if (e && this.errHandler !== ErrHandler.Ignore) throw e;
	}

	protected async doStop(context: any) {
		if (this.queueAction) await this.queueAction.stop(context);
		await super.doStop(context);
	}
}
