import { Action, CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunAll extends CompositeAction {
	constructor(errHandler: number) {
		super(errHandler);
	}

	protected async doStart(context: any) {
		if (this.children.length <= 0) return;
		//
		let rp = this.getRP();
		let total = this.children.length;
		let count = 0;
		let w: (action: Action) => any;
		let e: Error;
		for (const action of this.children) {
			action.start(context).watch(
				w ||
					(w = (action: Action) => {
						if (!this.isPending()) return rp.reject();
						//
						count++;
						if (action.isRejected()) {
							if (!e) e = action.getError();
							if (this.errHandler === ErrHandler.RejectImmediately) return rp.reject(e);
						}
						if (count >= total) {
							if (e && this.errHandler === ErrHandler.RejectAllDone) rp.reject(e);
							else rp.resolve();
						}
					}),
				0
			);
		}
		//
		await rp.p;
	}
}
