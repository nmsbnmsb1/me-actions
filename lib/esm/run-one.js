import { Action } from './action';
export class RunOne extends Action {
    constructor(ignoreErr = true, ...as) {
        super();
        this.ignoreErr = true;
        this.ignoreErr = ignoreErr;
        if (as && as.length > 0)
            this.addChild(...as);
    }
    setIgnoreErr(ignoreErr) {
        this.ignoreErr = ignoreErr;
        return this;
    }
    async doStart(context) {
        if (!this.children || this.children.length === 0)
            return;
        while (this.children.length > 0) {
            const action = this.children[0];
            const result = await action.startAsync(context);
            if (!this.isPending())
                return;
            this.children.shift();
            Action.logResult(result);
            if (action.isRejected() && !this.ignoreErr) {
                throw result.err;
            }
        }
    }
}
//# sourceMappingURL=run-one.js.map