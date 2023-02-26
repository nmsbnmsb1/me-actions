import { CompositeAction } from './action';
import { ActionStatus, ErrHandler } from './utils';
export class RunLogic extends CompositeAction {
    constructor(condition = ActionStatus.Resolved, count = 1) {
        super(ErrHandler.Ignore);
        this.condition = ActionStatus.Resolved;
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
                    if (this.condition === ActionStatus.Resolved) {
                        if (resolvedCount >= requiredCount) {
                            rp.resolve();
                        }
                        else {
                            rp.reject(new Error(`Rejected: ${resolvedCount} < ${requiredCount}`));
                        }
                    }
                    else if (this.condition === ActionStatus.Rejected) {
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
//# sourceMappingURL=run-logic.js.map