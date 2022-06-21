import { Action, CompositeAction } from './action';
import { RunQueue } from './run-queue';

export type IHandlerFactory = (i: number, stepOptions: { from: number; to: number; count: number }, caller?: RunStep, context?: any) => Action;
export type IOnStep = (stepOptions: { from: number; to: number; count: number }, action?: RunStep, context?: any) => Promise<any>;

export class RunStep extends CompositeAction {
	protected from: number;
	protected step: number;
	protected limit: number;
	protected to: number;
	protected endStep: boolean = false;
	protected queueName: string;
	protected queueAction!: RunQueue;
	protected onBeforeStep: IOnStep;
	protected handlerFactory: IHandlerFactory;
	protected onAfterStep: IOnStep;

	constructor(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep: IOnStep = undefined as any,
		handlerFactory: IHandlerFactory = undefined as any,
		onAfterStep: IOnStep = undefined as any,
		handleErr: 0 | 1 | 2 = 1
	) {
		super(handleErr);
		this.name = 'run-step';
		this.from = from;
		this.step = step;
		this.limit = limit;
		this.to = to;
		this.onBeforeStep = onBeforeStep;
		this.handlerFactory = handlerFactory;
		this.onAfterStep = onAfterStep;
	}
	public setQueueName(name: string) {
		this.queueName = name;
		return this;
	}
	public setStep(step: number) {
		this.step = step;
		return this;
	}
	public setLimit(limit: number) {
		this.limit = limit;
		return this;
	}
	public setTo(to: number) {
		this.to = to;
		return this;
	}
	public setValues(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep?: IOnStep,
		handlerFactory?: IHandlerFactory,
		onAfterStep?: IOnStep
	) {
		this.from = from;
		this.step = step;
		this.limit = limit;
		this.to = to;
		this.onBeforeStep = onBeforeStep as any;
		this.handlerFactory = handlerFactory as any;
		this.onAfterStep = onAfterStep as any;
		return this;
	}
	public setOnBeforeStep(fn: IOnStep) {
		this.onBeforeStep = fn;
		return this;
	}
	public setOnAfterStep(fn: IOnStep) {
		this.onAfterStep = fn;
		return this;
	}
	public end() {
		this.endStep = true;
		return this;
	}
	//
	public addChild(...as: Action[]) {
		if (this.queueAction) this.queueAction.addChild(...as);
		return this;
	}
	public numChildren() {
		return this.queueAction ? this.queueAction.numChildren() : 0;
	}

	//
	protected async doStart(context: any) {
		let count = 0;
		let err: any;
		let current = this.from;
		while (current <= this.to) {
			const stepOptions: any = { from: current, to: this.step > 0 ? Math.min(current + this.step - 1, this.to) : this.to, count };
			this.endStep = false;

			// before
			if (this.onBeforeStep) await this.onBeforeStep(stepOptions, this, context);
			if (!this.isPending()) break;
			if (this.endStep) {
				if (this.onAfterStep) await this.onAfterStep(stepOptions, this, context);
				break;
			}

			// pending
			this.queueAction = new RunQueue(0, 'auto', this.handleErr);
			if (this.queueName) this.queueAction.setName(this.queueName);
			this.children.push(this.queueAction);
			if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
				stepOptions.to = stepOptions.from + (this.limit - count) - 1;
			}
			count += stepOptions.to - stepOptions.from + 1;
			stepOptions.count = count;
			for (let i = stepOptions.from; i <= stepOptions.to; i++) {
				this.queueAction.addChild(this.handlerFactory(i, stepOptions, this, context));
				// console.log(i, options);
				// if (this.limit > 0 && count >= this.limit) { options.to = i; break; }
			}
			await this.queueAction.startAsync(context);
			this.children.length = 0;
			if (!this.isPending()) break;
			if (this.queueAction.isRejected()) {
				if (!err) err = this.queueAction.getResult().err;
				if (this.handleErr === 2) throw err;
			}
			this.queueAction = undefined;

			// after
			if (this.onAfterStep) await this.onAfterStep(stepOptions, this, context);
			if (!this.isPending()) break;
			if (this.endStep) break;
			if (this.limit > 0 && count >= this.limit) break;
			//
			current = stepOptions.to + 1;
			if (current > this.to) break;
		}
		// console.log("done");
		if (err && this.handleErr > 0) throw err;
	}

	protected doStop(context: any) {
		if (this.queueAction) this.queueAction.stop(context);
		super.doStop(context);
	}
}
