import { Action } from './action';

export class ActionForReject extends Action {
	private err: Error;

	constructor(err: Error) {
		super();
		this.name = 'action-reject';
		this.err = err;
	}

	protected async doStart(context: any) {
		throw this.err;
	}
}
