import { Action } from './action';
import { RunQueue } from './run-queue';

export type IHandlerFactory = (i: number, stepOptions: { from: number; to: number; count: number }, action?: RunStep, context?: any) => Action;
export type IOnStep = (stepOptions: { from: number; to: number; count: number }, action?: RunStep, context?: any) => Promise<any>;

export class RunStep extends Action {
	protected from: number;
	protected step: number;
	protected limit: number;
	protected to: number;
	protected ignoreErr: boolean = true;
	protected breakWhenErr: boolean = false;
	protected endStep: boolean = false;
	protected queueName: string = 'child-queue';
	//
	protected queueAction!: RunQueue;
	protected onBeforeStep: IOnStep;
	protected handleFactory: IHandlerFactory;
	protected onAfterStep: IOnStep;

	constructor(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep: IOnStep = undefined as any,
		handleFactory: IHandlerFactory = undefined as any,
		onAfterStep: IOnStep = undefined as any,
		ignoreErr: boolean = true,
		breakWhenErr: boolean = false
	) {
		super();
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

	public numChildren(): number {
		return this.queueAction ? this.queueAction.numChildren() : 0;
	}

	public setIgnoreErr(ignoreErr: boolean): RunStep {
		this.ignoreErr = ignoreErr;
		return this;
	}

	public setBreakWhenErr(breakWhenErr: boolean): RunStep {
		this.breakWhenErr = breakWhenErr;
		return this;
	}

	public setQueueName(queueName: string): RunStep {
		this.queueName = queueName;
		return this;
	}

	public setValues(
		from: number = 0,
		step: number = 0,
		limit: number = 0,
		to: number = 0,
		onBeforeStep?: IOnStep,
		handleFactory?: IHandlerFactory,
		onAfterStep?: IOnStep
	): RunStep {
		this.from = from;
		this.step = step;
		this.limit = limit;
		this.to = to;
		this.onBeforeStep = onBeforeStep as any;
		this.handleFactory = handleFactory as any;
		this.onAfterStep = onAfterStep as any;
		return this;
	}

	public setStep(step: number): RunStep {
		this.step = step;
		return this;
	}

	public setLimit(limit: number): RunStep {
		this.limit = limit;
		return this;
	}

	public setTo(to: number): RunStep {
		this.to = to;
		return this;
	}

	public setOnBeforeStep(fn: IOnStep): RunStep {
		this.onBeforeStep = fn;
		return this;
	}

	public setOnAfterStep(fn: IOnStep): RunStep {
		this.onAfterStep = fn;
		return this;
	}

	public end(): RunStep {
		this.endStep = true;
		return this;
	}

	public addChild(...as: Action[]): RunStep {
		if (this.queueAction) this.queueAction.addChild(...as);
		return this;
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
			this.queueAction = new RunQueue(0, 'auto', this.ignoreErr, this.breakWhenErr);
			//this.queueAction.setName(`${this.getName()}/${this.queueName}(${this.queueAction.getID()})`);
			this.queueAction.setName(this.getChildName(this.queueAction, this.queueName));
			if (this.limit > 0 && this.limit - count < stepOptions.to - stepOptions.from + 1) {
				stepOptions.to = stepOptions.from + (this.limit - count) - 1;
			}
			count += stepOptions.to - stepOptions.from + 1;
			stepOptions.count = count;
			for (let i = stepOptions.from; i <= stepOptions.to; i++) {
				this.queueAction.addChild(this.handleFactory(i, stepOptions, this, context));
				// console.log(i, options);
				// if (this.limit > 0 && count >= this.limit) { options.to = i; break; }
			}
			await this.queueAction.startAsync(context);
			if (!this.isPending()) break;
			if (!this.ignoreErr && this.queueAction.isRejected()) {
				if (!this.breakWhenErr) {
					if (!err) err = this.queueAction.getResult().err;
				} else {
					throw this.queueAction.getResult().err;
					// console.log("runstep caught", this.getName());
				}
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
		if (err) throw err;
	}

	protected async doStop(context: any): Promise<any> {
		if (this.queueAction) this.queueAction.stop(context);
		super.doStop(context);
	}
}
