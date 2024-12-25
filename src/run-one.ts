import { CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunOne extends CompositeAction {
	protected async doStart(context: any) {
		let e: Error;
		while (this.children.length > 0) {
			let action = this.children.shift();
			await action.start(context);
			if (this.isPending() && action.isRejected()) {
				if (this.errHandler === ErrHandler.RejectImmediately) throw action.getError();
				if (!e) {
					e = action.getError();
				}
			}
		}
		//
		if (e && this.errHandler === ErrHandler.RejectAllDone) throw e;
	}
}
