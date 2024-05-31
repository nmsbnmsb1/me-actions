"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionForSleep = void 0;
const action_1 = require("./action");
class ActionForSleep extends action_1.Action {
    constructor(timeout) {
        super();
        this.timeout = timeout;
    }
    async doStart() {
        let rp = this.getRP();
        this.timer = setTimeout(rp.resolve, this.timeout);
        await rp.p;
    }
    async doStop() {
        if (this.timer)
            clearTimeout(this.timer);
        this.timer = undefined;
    }
}
exports.ActionForSleep = ActionForSleep;
//# sourceMappingURL=action-sleep.js.map