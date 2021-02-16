import { Action, IResult } from './action';

export class RunOne extends Action {
	protected ignoreErr: boolean = true;

	constructor(ignoreErr: boolean = true, ...as: Action[]) {
		super();
		this.ignoreErr = ignoreErr;
		if (as && as.length > 0) this.addChild(...as);
	}

	public setIgnoreErr(ignoreErr: boolean): RunOne {
		this.ignoreErr = ignoreErr;
		return this;
	}

	protected async doStart(context: any) {
		if (!this.children || this.children.length === 0) return;
		//
		while (this.children.length > 0) {
			const action: Action = this.children[0];
			const result: IResult = await action.startAsync(context);
			if (!this.isPending()) return;
			this.children.shift();

			Action.logResult(result);
			if (action.isRejected() && !this.ignoreErr) {
				throw result.err;
			}
		}
	}
}
