"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunLogic = void 0;
const action_1 = require("./action");
class RunLogic extends action_1.Action {
    constructor(condition = action_1.Action.StatusResolved, count = 1, ...as) {
        super();
        this.condition = action_1.Action.StatusResolved;
        this.count = 1;
        this.condition = condition;
        this.count = count;
        if (as && as.length > 0)
            this.addChild(...as);
    }
    setCondition(condition) {
        this.condition = condition;
        return this;
    }
    setCount(count) {
        this.count = count;
        return this;
    }
    doStart(context) {
        if (!this.children || this.children.length === 0)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            const total = this.children.length;
            let requiredCount = this.count === 0 ? total : this.count;
            let doneCount = 0;
            let resolvedCount = 0;
            let rejectedCount = 0;
            for (const action of this.children) {
                action.start(context).watchFinally((result) => {
                    if (!this.isPending()) {
                        reject();
                        return;
                    }
                    doneCount++;
                    if (action.isResolved())
                        resolvedCount++;
                    if (action.isRejected())
                        rejectedCount++;
                    action_1.Action.logResult(result);
                    if (doneCount < requiredCount)
                        return;
                    if (this.condition === action_1.Action.StatusResolved) {
                        if (resolvedCount >= requiredCount) {
                            resolve();
                        }
                        else {
                            reject(new Error(`${resolvedCount} < ${requiredCount}`));
                        }
                    }
                    else if (this.condition === action_1.Action.StatusRejected) {
                        if (rejectedCount >= requiredCount) {
                            reject(new Error(`${rejectedCount} < ${requiredCount}`));
                        }
                        else {
                            resolve();
                        }
                    }
                });
            }
        });
    }
}
exports.RunLogic = RunLogic;
//# sourceMappingURL=run-logic.js.map