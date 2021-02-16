import { Action, IResult } from './action';

export class RunAll extends Action {
	protected ignoreErr: boolean = true;
	protected breakWhenErr: boolean = false;

	//ignoreErr true,将不会产生任何错误,action的最后状态是resolved
	//          false, action的最后状态可能是是rejected
	constructor(ignoreErr: boolean = true, breakWhenErr: boolean = false, ...as: Action[]) {
		super();
		this.ignoreErr = ignoreErr;
		this.breakWhenErr = breakWhenErr;
		if (as && as.length > 0) this.addChild(...as);
	}

	public setIgnoreErr(ignoreErr: boolean): RunAll {
		this.ignoreErr = ignoreErr;
		return this;
	}

	public setBreakWhenErr(breakWhenErr: boolean): RunAll {
		this.breakWhenErr = breakWhenErr;
		return this;
	}

	protected doStart(context: any) {
		if (!this.children || this.children.length === 0) return Promise.resolve();
		//
		return new Promise<void>((resolve, reject) => {
			const total = this.children.length;
			let count = 0;
			let err: any;
			for (const action of this.children) {
				action.start(context).watchFinally((result: IResult) => {
					if (!this.isPending()) {
						reject();
						return;
					}
					count++;
					Action.logResult(result);
					//
					if (action.isRejected()) {
						if (!err) err = result.err;
						if (this.breakWhenErr) {
							reject(err);
							return;
						}
					}
					//
					if (count >= total) {
						if (err && !this.ignoreErr) {
							reject(err);
						} else {
							resolve();
						}
					}
				});
			}
		});
	}
}
