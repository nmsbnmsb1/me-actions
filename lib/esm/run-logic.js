import { Action, CompositeAction } from './action';
export class RunLogic extends CompositeAction {
    condition = Action.StatusResolved;
    count = 1;
    constructor(condition = Action.StatusResolved, count = 1, ...as) {
        super(0, ...as);
        this.name = 'run-logic';
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
        let p = Action.defer();
        let total = this.children.length;
        let requiredCount = this.count === 0 ? total : this.count;
        let doneCount = 0;
        let resolvedCount = 0;
        let rejectedCount = 0;
        let w;
        for (const action of this.children) {
            action.start(context).watchFinallyAtFirst(w ||
                (w = (result) => {
                    if (!this.isPending()) {
                        p.reject();
                        return;
                    }
                    doneCount++;
                    if (action.isResolved())
                        resolvedCount++;
                    if (action.isRejected())
                        rejectedCount++;
                    if (doneCount < requiredCount)
                        return;
                    if (this.condition === Action.StatusResolved) {
                        if (resolvedCount >= requiredCount) {
                            p.resolve();
                        }
                        else {
                            p.reject(new Error(`rejected: ${resolvedCount} < ${requiredCount}`));
                        }
                    }
                    else if (this.condition === Action.StatusRejected) {
                        if (rejectedCount >= requiredCount) {
                            p.reject(new Error(`rejected: ${rejectedCount} < ${requiredCount}`));
                        }
                        else {
                            p.resolve();
                        }
                    }
                }));
        }
        await p.p;
    }
}
//# sourceMappingURL=run-logic.js.map