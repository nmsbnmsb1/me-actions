import { Action } from './action';
export class ActionForReject extends Action {
    constructor(err) {
        super();
        this.err = err;
    }
    async doStart() {
        throw this.err;
    }
}
//# sourceMappingURL=action-reject.js.map