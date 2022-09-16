import { Action } from './action';
export class ActionForFunc extends Action {
    constructor(doStart, doStop) {
        super();
        this.name = 'action-func';
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
    doStart(context) {
        return this.iDoStart(context, this);
    }
    doStop(context) {
        if (this.iDoStop)
            this.iDoStop(context, this);
    }
}
//# sourceMappingURL=action-func.js.map