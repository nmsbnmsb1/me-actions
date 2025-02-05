import { type Action, CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunAll extends CompositeAction {
	protected async doStart(context: any) {
		if (this.children.length <= 0) return;
		//
		let rp = this.getRP();
		let total = this.children.length;
		let count = 0;
		let w: any;
		let e: Error;
		for (let action of this.children) {
			action.start(context).then(
				w ||
					(w = (action: Action) => {
						if (!this.isPending()) return rp.reject(new Error("It's not pending"));
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
					})
			);
		}
		//
		await rp.p;
	}
}
