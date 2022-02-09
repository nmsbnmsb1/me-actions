"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionForSleep = void 0;
const action_1 = require("./action");
class ActionForSleep extends action_1.Action {
    constructor(timeout) {
        super();
        this.name = 'action-sleep';
        this.timeout = timeout;
    }
    async doStart(context) {
        this.tp = action_1.Action.defer();
        this.timer = setTimeout(this.tp.resolve, this.timeout);
        await this.tp.p;
    }
    doStop(context) {
        clearTimeout(this.timer);
        if (this.tp)
            this.tp.reject();
    }
}
exports.ActionForSleep = ActionForSleep;
//# sourceMappingURL=action-sleep.js.map