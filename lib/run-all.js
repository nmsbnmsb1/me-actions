"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunAll = void 0;
const action_1 = require("./action");
const utils_1 = require("./utils");
class RunAll extends action_1.CompositeAction {
    constructor(errHandler) {
        super(errHandler);
    }
    async doStart(context) {
        if (this.children.length <= 0)
            return;
        let total = this.children.length;
        let count = 0;
        let then;
        let e;
        for (const action of this.children) {
            action.start(context).then(then ||
                (then = (action) => {
                    if (!this.isPending())
                        return this.getRP().reject();
                    count++;
                    if (action.isRejected()) {
                        if (!e)
                            e = action.getError();
                        if (this.errHandler === utils_1.ErrHandler.RejectImmediately)
                            return this.getRP().reject(e);
                    }
                    if (count >= total) {
                        if (e && this.errHandler === utils_1.ErrHandler.RejectAllDone)
                            this.getRP().reject(e);
                        else
                            this.getRP().resolve();
                    }
                }));
        }
        await this.getRP().p;
    }
}
exports.RunAll = RunAll;
//# sourceMappingURL=run-all.js.map