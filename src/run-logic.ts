import { Action, CompositeAction, IResult } from './action';

export class RunLogic extends CompositeAction {
	protected condition: string = Action.StatusResolved;
	protected count: number = 1;

	constructor(condition: string = Action.StatusResolved, count: number = 1, ...as: Action[]) {
		super(0, ...as);
		this.name = 'run-logic';
		this.condition = condition;
		this.count = count;
	}
	public setCondition(condition: string) {
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
		let p = Action.defer();
		let total = this.children.length;
		let requiredCount = this.count === 0 ? total : this.count;
		let doneCount = 0;
		let resolvedCount = 0;
		let rejectedCount = 0;
		let w;
		for (const action of this.children) {
			action.start(context).watchFinallyAtFirst(
				w ||
					(w = (result: IResult) => {
						if (!this.isPending()) {
							p.reject();
							return;
						}
						//
						doneCount++;
						if (action.isResolved()) resolvedCount++;
						if (action.isRejected()) rejectedCount++;
						//
						if (doneCount < requiredCount) return;
						//
						if (this.condition === Action.StatusResolved) {
							if (resolvedCount >= requiredCount) {
								p.resolve();
							} else {
								p.reject(new Error(`rejected: ${resolvedCount} < ${requiredCount}`));
							}
						} else if (this.condition === Action.StatusRejected) {
							if (rejectedCount >= requiredCount) {
								p.reject(new Error(`rejected: ${rejectedCount} < ${requiredCount}`));
							} else {
								p.resolve();
							}
						}
					})
			);
		}
		//
		await p.p;
	}
}
