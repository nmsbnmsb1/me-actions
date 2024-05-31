import { Action } from './action';
export class ActionForSleep extends Action {
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
//# sourceMappingURL=action-sleep.js.map