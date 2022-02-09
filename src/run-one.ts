import { Action, CompositeAction, IResult } from './action';

export class RunOne extends CompositeAction {
	//
	constructor(handleErr: 0 | 1 | 2 = 0, ...as: Action[]) {
		super(handleErr, ...as);
		this.name = 'run-one';
	}
	//
	protected async doStart(context: any) {
		while (this.children.length > 0) {
			const action: Action = this.children[0];
			const result: IResult = await action.startAsync(context);
			if (!this.isPending()) return;
			//
			this.children.shift();
			if (action.isRejected() && this.handleErr > 0) {
				throw result.err;
			}
		}
	}
}
