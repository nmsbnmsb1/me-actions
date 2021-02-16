import { Action, IDeferer } from './action';

export class ActionForSleep extends Action {
	private timeout: number;
	private timer: any;
	private tp: IDeferer;

	constructor(timeout: number) {
		super();
		this.timeout = timeout;
	}

	protected async doStart(context: any) {
		this.tp = Action.defer();
		this.timer = setTimeout(this.tp.resolve, this.timeout, true);
		return this.tp.p;
	}

	protected doStop(context: any) {
		clearTimeout(this.timer);
		if (this.tp) this.tp.reject(false);
	}
}
