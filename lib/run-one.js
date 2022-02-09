"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunOne = void 0;
const action_1 = require("./action");
class RunOne extends action_1.CompositeAction {
    constructor(handleErr = 0, ...as) {
        super(handleErr, ...as);
        this.name = 'run-one';
    }
    async doStart(context) {
        while (this.children.length > 0) {
            const action = this.children[0];
            const result = await action.startAsync(context);
            if (!this.isPending())
                return;
            this.children.shift();
            if (action.isRejected() && this.handleErr > 0) {
                throw result.err;
            }
        }
    }
}
exports.RunOne = RunOne;
//# sourceMappingURL=run-one.js.map