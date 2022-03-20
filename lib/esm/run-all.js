import { Action, CompositeAction } from './action';
export class RunAll extends CompositeAction {
    constructor(handleErr = 1, ...as) {
        super(handleErr, ...as);
        this.name = 'run-all';
    }
    async doStart(context) {
        if (this.children.length === 0)
            return;
        let p = Action.defer();
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
//# sourceMappingURL=run-all.js.map