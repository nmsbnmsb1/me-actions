import { CompositeAction } from './action';
import { ErrHandler } from './utils';
export class RunOne extends CompositeAction {
    constructor(errHandler) {
        super(errHandler);
    }
    async doStart(context) {
        let e;
        while (this.children.length > 0) {
            let action = this.children.shift();
            await action.startAsync(context);
            if (!this.isPending())
                return;
            if (action.isRejected()) {
                if (this.errHandler === ErrHandler.RejectImmediately)
                    throw action.getError();
                else if (!e) {
                    e = action.getError();
                }
            }
        }
        if (e && this.errHandler === ErrHandler.RejectAllDone)
            throw e;
    }
}
//# sourceMappingURL=run-one.js.map