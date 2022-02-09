const { RunStep, RunFunc } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new RunStep(
		0,
		2,
		0,
		2,
		undefined,
		(i) => {
			return new RunFunc(() => {
				return new Promise((resolve) => {
					setTimeout(() => {
						console.log(`a${i}`, i);
						resolve(i);
					}, 1000);
				});
			}).setName(`${i}`);
		},
		undefined
	);
	a1.setName('run-step');

	setTimeout(() => {
		a1.stop();
		console.log('stop');
	}, 500);
	//
	console.log('final', await a1.startAsync(context));
})();
