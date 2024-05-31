import { CompositeAction } from './action';
import { ErrHandler } from './utils';

export class RunOne extends CompositeAction {
	constructor(errHandler: number) {
		super(errHandler);
	}

	protected async doStart(context: any) {
		let e: Error;
		while (this.children.length > 0) {
			let action = this.children.shift();
			await action.start(context);
			if (this.isPending() && action.isRejected()) {
				if (this.errHandler === ErrHandler.RejectImmediately) throw action.getError();
				else if (!e) {
					e = action.getError();
				}
			}
		}
		//
		if (e && this.errHandler === ErrHandler.RejectAllDone) throw e;
	}
}
