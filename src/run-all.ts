import { type Action, CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunAll extends CompositeAction {
	protected async doStart(context: any) {
		if (this.children.length <= 0) return;
		//
		let total = this.children.length;
		let count = 0;
		let w: any;
		let e: Error;
		for (const action of this.children) {
			action.start(context).then(
				w ||
					(w = (action: Action) => {
						if (!this.isPending()) return this.getRP().reject();
						//
						count++;
						if (action.isRejected()) {
							if (!e) e = action.getError();
							if (this.errHandler === ErrHandler.RejectImmediately) return this.getRP().reject(e);
						}
						if (count >= total) {
							if (e && this.errHandler === ErrHandler.RejectAllDone) this.getRP().reject(e);
							else this.getRP().resolve();
						}
					})
			);
		}
		//
		await this.getRP().p;
	}
}
