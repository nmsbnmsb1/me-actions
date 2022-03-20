"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunAll = void 0;
const action_1 = require("./action");
class RunAll extends action_1.CompositeAction {
    constructor(handleErr = 1, ...as) {
        super(handleErr, ...as);
        this.name = 'run-all';
    }
    async doStart(context) {
        if (this.children.length === 0)
            return;
        let p = action_1.Action.defer();
        let count = 0;
        let total = this.children.length;
        let err;
        let w;
        for (const action of this.children) {
            action.start(context).watchFinallyAtFirst(w ||
                (w = (result) => {
                    if (!this.isPending()) {
                        p.reject();
                        return;
                    }
                    count++;
                    if (result.action.isRejected()) {
                        if (!err)
                            err = result.err;
                        if (this.handleErr === 2) {
                            p.reject(err);
                            return;
                        }
                    }
                    if (count >= total) {
                        if (err && this.handleErr > 0)
                            p.reject(err);
                        else
                            p.resolve();
                    }
                }));
        }
        await p.p;
    }
}
exports.RunAll = RunAll;
//# sourceMappingURL=run-all.js.map