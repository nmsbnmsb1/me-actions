"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionForFunc = void 0;
const action_1 = require("./action");
class ActionForFunc extends action_1.Action {
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
exports.ActionForFunc = ActionForFunc;
//# sourceMappingURL=action-func.js.map