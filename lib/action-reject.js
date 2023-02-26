"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionForReject = void 0;
const action_1 = require("./action");
class ActionForReject extends action_1.Action {
    constructor(err) {
        super();
        this.err = err;
    }
    async doStart() {
        throw this.err;
    }
}
exports.ActionForReject = ActionForReject;
//# sourceMappingURL=action-reject.js.map