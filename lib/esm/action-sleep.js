import { Action } from './action';
export class ActionForSleep extends Action {
    constructor(timeout) {
        super();
        this.timeout = timeout;
    }
    async doStart(context) {
        this.tp = Action.defer();
        this.timer = setTimeout(this.tp.resolve, this.timeout, true);
        return this.tp.p;
    }
    doStop(context) {
        clearTimeout(this.timer);
        if (this.tp)
            this.tp.reject(false);
    }
}
//# sourceMappingURL=action-sleep.js.map