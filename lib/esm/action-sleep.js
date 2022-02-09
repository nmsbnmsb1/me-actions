import { Action } from './action';
export class ActionForSleep extends Action {
    timeout;
    timer;
    tp;
    constructor(timeout) {
        super();
        this.name = 'action-sleep';
        this.timeout = timeout;
    }
    async doStart(context) {
        this.tp = Action.defer();
        this.timer = setTimeout(this.tp.resolve, this.timeout);
        await this.tp.p;
    }
    doStop(context) {
        clearTimeout(this.timer);
        if (this.tp)
            this.tp.reject();
    }
}
//# sourceMappingURL=action-sleep.js.map