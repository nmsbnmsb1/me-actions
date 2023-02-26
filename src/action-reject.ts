import { Action } from './action';

export class ActionForReject extends Action {
	private err: Error;

	constructor(err: Error) {
		super();
		this.err = err;
	}

	protected async doStart() {
		throw this.err;
	}
}
