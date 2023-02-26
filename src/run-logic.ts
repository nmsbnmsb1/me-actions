import { Action, CompositeAction } from './action';
import { ActionStatus, ErrHandler } from './utils';

export class RunLogic extends CompositeAction {
	protected condition = ActionStatus.Resolved;
	protected count = 1;

	constructor(condition: number = ActionStatus.Resolved, count: number = 1) {
		super(ErrHandler.Ignore);
		this.condition = condition;
		this.count = count;
	}
	public setCondition(condition: number) {
		this.condition = condition;
		return this;
	}
	public setCount(count: number) {
		this.count = count;
		return this;
	}
	//
	protected async doStart(context: any) {
		if (this.children.length === 0) return;
		//
		let rp = this.getRP();
		let total = this.children.length;
		let requiredCount = this.count === 0 ? total : this.count;
		let doneCount = 0;
		let resolvedCount = 0;
		let rejectedCount = 0;
		let w: (action: Action) => any;
		for (const action of this.children) {
			action.start(context).watch(
				w ||
					(w = (action: Action) => {
						if (!this.isPending()) return rp.reject();
						//
						doneCount++;
						if (action.isResolved()) resolvedCount++;
						else if (action.isRejected()) rejectedCount++;
						//
						if (doneCount < requiredCount) return;
						//
						if (this.condition === ActionStatus.Resolved) {
							if (resolvedCount >= requiredCount) {
								rp.resolve();
							} else {
								rp.reject(new Error(`Rejected: ${resolvedCount} < ${requiredCount}`));
							}
						} else if (this.condition === ActionStatus.Rejected) {
							if (rejectedCount >= requiredCount) {
								rp.reject(new Error(`Rejected: ${rejectedCount} < ${requiredCount}`));
							} else {
								rp.resolve();
							}
						}
					}),
				0
			);
		}
		//
		await rp.p;
	}
}
