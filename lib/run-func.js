"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RunFunc = void 0;
const action_1 = require("./action");
class RunFunc extends action_1.Action {
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
exports.RunFunc = RunFunc;
//# sourceMappingURL=run-func.js.map