import { Action } from './action';
export class RunAll extends Action {
    constructor(ignoreErr = true, breakWhenErr = false, ...as) {
        super();
        this.ignoreErr = true;
        this.breakWhenErr = false;
        this.ignoreErr = ignoreErr;
        this.breakWhenErr = breakWhenErr;
        if (as && as.length > 0)
            this.addChild(...as);
    }
    setIgnoreErr(ignoreErr) {
        this.ignoreErr = ignoreErr;
        return this;
    }
    setBreakWhenErr(breakWhenErr) {
        this.breakWhenErr = breakWhenErr;
        return this;
    }
    doStart(context) {
        if (!this.children || this.children.length === 0)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            const total = this.children.length;
            let count = 0;
            let err;
            for (const action of this.children) {
                action.start(context).watchFinally((result) => {
                    if (!this.isPending()) {
                        reject();
                        return;
                    }
                    count++;
                    Action.logResult(result);
                    if (action.isRejected()) {
                        if (!err)
                            err = result.err;
                        if (this.breakWhenErr) {
                            reject(err);
                            return;
                        }
                    }
                    if (count >= total) {
                        if (err && !this.ignoreErr) {
                            reject(err);
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
//# sourceMappingURL=run-all.js.map