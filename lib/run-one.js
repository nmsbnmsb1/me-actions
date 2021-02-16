"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunOne = void 0;
const action_1 = require("./action");
class RunOne extends action_1.Action {
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
            action_1.Action.logResult(result);
            if (action.isRejected() && !this.ignoreErr) {
                throw result.err;
            }
        }
    }
}
exports.RunOne = RunOne;
//# sourceMappingURL=run-one.js.map