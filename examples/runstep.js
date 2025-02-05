const { RunStep, ActionForFunc } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new RunStep(
		0,
		2,
		0,
		2,
		undefined,
		(_,__, i) => {
			return new ActionForFunc(() => new Promise((resolve) => {
				setTimeout(() => {
					console.log(`a${i}`, i);
					resolve(i);
				}, 1000);
			})).setName(`${i}`);
		},
		undefined
	);
	a1.setName('run-step');

	// setTimeout(() => {
	// 	a1.stop();
	// 	console.log('stop');
	// }, 500);
	//
	console.log('final', await a1.start(context));
})();
