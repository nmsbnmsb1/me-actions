import { Action } from './action';
export class ActionForReject extends Action {
    constructor(err) {
        super();
        this.name = 'action-reject';
        this.err = err;
    }
    async doStart(context) {
        throw this.err;
    }
}
//# sourceMappingURL=action-reject.js.map