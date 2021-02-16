import { Action, IResult } from './action';

export class RunLogic extends Action {
	protected condition: string = Action.StatusResolved;
	protected count: number = 1;

	constructor(condition: string = Action.StatusResolved, count: number = 1, ...as: Action[]) {
		super();
		this.condition = condition;
		this.count = count;
		if (as && as.length > 0) this.addChild(...as);
	}

	public setCondition(condition: string): RunLogic {
		this.condition = condition;
		return this;
	}

	public setCount(count: number): RunLogic {
		this.count = count;
		return this;
	}

	protected doStart(context: any) {
		if (!this.children || this.children.length === 0) return Promise.resolve();
		//
		return new Promise<void>((resolve, reject) => {
			const total = this.children.length;
			let requiredCount = this.count === 0 ? total : this.count;
			let doneCount = 0;
			let resolvedCount = 0;
			let rejectedCount = 0;
			for (const action of this.children) {
				action.start(context).watchFinally((result: IResult) => {
					if (!this.isPending()) {
						reject();
						return;
					}
					//
					doneCount++;
					if (action.isResolved()) resolvedCount++;
					if (action.isRejected()) rejectedCount++;
					Action.logResult(result);
					//统计结果
					if (doneCount < requiredCount) return;
					//
					if (this.condition === Action.StatusResolved) {
						if (resolvedCount >= requiredCount) {
							resolve();
						} else {
							reject(new Error(`${resolvedCount} < ${requiredCount}`));
						}
					} else if (this.condition === Action.StatusRejected) {
						if (rejectedCount >= requiredCount) {
							reject(new Error(`${rejectedCount} < ${requiredCount}`));
						} else {
							resolve();
						}
					}
				});
			}
		});
	}
}
