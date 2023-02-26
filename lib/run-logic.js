"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunLogic = void 0;
const action_1 = require("./action");
const utils_1 = require("./utils");
class RunLogic extends action_1.CompositeAction {
    constructor(condition = utils_1.ActionStatus.Resolved, count = 1) {
        super(utils_1.ErrHandler.Ignore);
        this.condition = utils_1.ActionStatus.Resolved;
        this.count = 1;
        this.condition = condition;
        this.count = count;
    }
    setCondition(condition) {
        this.condition = condition;
        return this;
    }
    setCount(count) {
        this.count = count;
        return this;
    }
    async doStart(context) {
        if (this.children.length === 0)
            return;
        let rp = this.getRP();
        let total = this.children.length;
        let requiredCount = this.count === 0 ? total : this.count;
        let doneCount = 0;
        let resolvedCount = 0;
        let rejectedCount = 0;
        let w;
        for (const action of this.children) {
            action.start(context).watch(w ||
                (w = (action) => {
                    if (!this.isPending())
                        return rp.reject();
                    doneCount++;
                    if (action.isResolved())
                        resolvedCount++;
                    else if (action.isRejected())
                        rejectedCount++;
                    if (doneCount < requiredCount)
                        return;
                    if (this.condition === utils_1.ActionStatus.Resolved) {
                        if (resolvedCount >= requiredCount) {
                            rp.resolve();
                        }
                        else {
                            rp.reject(new Error(`Rejected: ${resolvedCount} < ${requiredCount}`));
                        }
                    }
                    else if (this.condition === utils_1.ActionStatus.Rejected) {
                        if (rejectedCount >= requiredCount) {
                            rp.reject(new Error(`Rejected: ${rejectedCount} < ${requiredCount}`));
                        }
                        else {
                            rp.resolve();
                        }
                    }
                }), 0);
        }
        await rp.p;
    }
}
exports.RunLogic = RunLogic;
//# sourceMappingURL=run-logic.js.map