import { Action } from './action';

export class ActionForResolve extends Action {
	constructor(err: Error) {
		super();
		this.name = 'action-resolve';
	}
}
