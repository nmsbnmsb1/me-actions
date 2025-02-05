const { RunAll, ActionForFunc } = require('../lib');

const context = { datas: {}, errs: {} };

function getAction(id,time) {
	return new ActionForFunc(() => new Promise((resolve) => setTimeout(() => {
		console.log(`a${id}`, id);
		resolve(id);
	}, time))).setName(id)
}
//a1
(async () => {
	const a1 = new RunAll(1);
	a1.setName('run-all');
	a1.addChild(getAction(1,1000));
	a1.addChild(getAction(2,1000));
	a1.addChild(getAction(3,1000));
	a1.addChild(getAction(4,4000));

	// setTimeout(() => {
	// 	a1.stop();
	// 	console.log('stop');
	// }, 500);

	console.log('final', await a1.start(context));
})();
