"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunOne = void 0;
const action_1 = require("./action");
const utils_1 = require("./utils");
class RunOne extends action_1.CompositeAction {
    constructor(errHandler) {
        super(errHandler);
    }
    async doStart(context) {
        let e;
        while (this.children.length > 0) {
            let action = this.children.shift();
            await action.start(context);
            if (this.isPending() && action.isRejected()) {
                if (this.errHandler === utils_1.ErrHandler.RejectImmediately)
                    throw action.getError();
                else if (!e) {
                    e = action.getError();
                }
            }
        }
        if (e && this.errHandler === utils_1.ErrHandler.RejectAllDone)
            throw e;
    }
}
exports.RunOne = RunOne;
//# sourceMappingURL=run-one.js.map