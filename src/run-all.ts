import { Action, CompositeAction, IResult } from './action';

export class RunAll extends CompositeAction {
	//ignoreErr true,将不会产生任何错误,action的最后状态是resolved
	//          false, action的最后状态可能是rejected
	constructor(handleErr: 0 | 1 | 2 = 1, ...as: Action[]) {
		super(handleErr, ...as);
		this.name = 'run-all';
	}
	//
	protected async doStart(context: any) {
		if (this.children.length === 0) return;
		//
		let p = Action.defer();
		let count = 0;
		let total = this.children.length;
		let err: any;
		let w;
		for (const action of this.children) {
			action.start(context).watchFinally(
				w ||
					(w = (result: IResult) => {
						if (!this.isPending()) {
							p.reject();
							return;
						}
						//
						count++;
						if (result.action.isRejected()) {
							if (!err) err = result.err;
							if (this.handleErr === 2) {
								p.reject(err);
								return;
							}
						}
						if (count >= total) {
							if (err && this.handleErr > 0) p.reject(err);
							else p.resolve();
						}
					})
			);
		}
		//
		await p.p;
	}
}
