import { Action } from './action';
export class ActionForFunc extends Action {
    constructor(doStart, doStop) {
        super();
        this.iDoStart = doStart;
        this.iDoStop = doStop;
    }
    setDoStart(f) {
        this.iDoStart = f;
        return this;
    }
    setDoStop(f) {
        this.iDoStop = f;
        return this;
    }
    async doStart(context) {
        return this.iDoStart(context, this);
    }
    doStop(context) {
        if (this.iDoStop)
            return this.iDoStop(context, this);
    }
}
//# sourceMappingURL=action-func.js.map