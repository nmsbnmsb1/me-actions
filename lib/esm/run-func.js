import { Action } from './action';
export class RunFunc extends Action {
    constructor(doStart, doStop) {
        super();
        this.iDoStart = doStart;
        this.iDoStop = doStop;
    }
    doStart(context) {
        return this.iDoStart(context, this);
    }
    doStop(context) {
        if (this.iDoStop)
            this.iDoStop(context, this);
    }
}
//# sourceMappingURL=run-func.js.map