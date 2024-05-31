const { RunOne, ActionForFunc } = require('../lib');

const context = { datas: {}, errs: {} };

//a1
(async () => {
	const a1 = new RunOne(false);
	a1.setName('run-one');
	a1.addChild(
		new ActionForFunc(() => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a1', 1);
					resolve(1);
				}, 2000);
			});
		}).setName('1')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a2', 2);
					resolve(2);
				}, 1100);
			});
		}).setName('2')
	);
	a1.addChild(
		new ActionForFunc(async () => {
			return new Promise((resolve) => {
				setTimeout(() => {
					console.log('a3', 3);
					resolve(3);
				}, 1200);
			});
		}).setName('3')
	);

	setTimeout(() => {
		a1.stop();
		console.log('stop');
	}, 500);

	console.log('final', await a1.start(context));
})();
