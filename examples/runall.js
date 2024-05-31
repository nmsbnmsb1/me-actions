const { RunAll, ActionForFunc } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new RunAll(false);
	a1.setName('run-all');
	a1.addChild(
		new ActionForFunc(() => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a1', 1);
					resolve(1);
				}, 1000);
			});
		}).setName('1')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a2', 2);
					resolve(2);
				}, 1000);
			});
		}).setName('2')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a3', 3);
					resolve(3);
				}, 2000);
			});
		}).setName('3')
	);

	setTimeout(() => {
		a1.stop();
		console.log('stop');
	}, 500);

	console.log('final', await a1.start(context));
})();
