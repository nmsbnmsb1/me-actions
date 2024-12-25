import { Action } from "./action";

export class ActionForSleep extends Action {
	private timeout: number;
	private timer: any;

	constructor(timeout: number) {
		super();
		this.timeout = timeout;
	}

	protected async doStart() {
		let rp = this.getRP();
		this.timer = setTimeout(rp.resolve, this.timeout);
		await rp.p;
	}

	protected async doStop() {
		if (this.timer) clearTimeout(this.timer);
		this.timer = undefined;
	}
}
